import json
from pathlib import Path

import pytest

from scripts.import_gdb_sources import ImportFailure, import_candidates
from scripts.validate_source_candidates import validate_ledger


IMPORTED_AT = "2026-08-19T00:00:00+00:00"


def write_fixture(root: Path) -> tuple[Path, Path]:
    chapter_dir = root / "public" / "en"
    chapter_dir.mkdir(parents=True)
    (chapter_dir / "physical-dysphoria.md").write_text(
        (
            "---\ntweets:\n  - '123456'\n---\n# Physical\n"
            "[Repeated](https://twitter.com/example/status/123456)\n"
            "[Context](https://twitter.com/example/status/654321)\n"
        ),
        encoding="utf-8",
    )
    (chapter_dir / "social-dysphoria.md").write_text(
        "---\ntweets:\n  - https://twitter.com/example/status/123456\n---\n# Social\n",
        encoding="utf-8",
    )
    backup_path = root / "twitter-backup.json"
    backup_path.write_text(
        json.dumps(
            {
                "123456": {
                    "id_str": "123456",
                    "full_text": "A first-person experience",
                    "created_at": "Fri Jan 10 20:39:42 +0000 2020",
                    "lang": "en",
                    "favorite_count": 3,
                    "retweet_count": 1,
                    "user": {
                        "id_str": "42",
                        "name": "Example",
                        "screen_name": "example",
                        "description": "Profile data excluded from the candidate",
                        "followers_count": 999,
                    },
                }
            }
        ),
        encoding="utf-8",
    )
    return chapter_dir, backup_path


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]


def test_import_deduplicates_posts_and_limits_author_fields(tmp_path: Path) -> None:
    chapter_dir, backup_path = write_fixture(tmp_path)
    output_path = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"

    manifest = import_candidates(
        chapter_dir=chapter_dir,
        backup_path=backup_path,
        output_path=output_path,
        manifest_path=manifest_path,
        chapters=("physical-dysphoria", "social-dysphoria"),
        imported_at=IMPORTED_AT,
    )

    candidates = read_jsonl(output_path)
    assert manifest["candidateCount"] == 1
    assert manifest["bodyOnlyTweetIds"] == ["654321"]
    assert manifest["bodyOnlyTweetReferences"] == [
        {
            "chapter": "physical-dysphoria",
            "line": 7,
            "postId": "654321",
            "referenceType": "body_link",
        }
    ]
    assert manifest["missingBodyOnlyTweetIds"] == ["654321"]
    assert candidates[0]["source"]["metadata"]["gdbChapters"] == [
        "physical-dysphoria",
        "social-dysphoria",
    ]
    assert candidates[0]["source"]["metadata"]["retrievalBasis"] == (
        "local_backup_import"
    )
    assert manifest["backupContentHash"]
    assert set(candidates[0]["source"]["author"]) == {
        "displayName",
        "handle",
        "nativeId",
        "url",
    }
    assert candidates[0]["source"]["metadata"]["gdbReferences"] == [
        {
            "chapter": "physical-dysphoria",
            "line": 3,
            "postId": "123456",
            "referenceType": "frontmatter",
        },
        {
            "chapter": "social-dysphoria",
            "line": 3,
            "postId": "123456",
            "referenceType": "frontmatter",
        },
    ]
    assert candidates[0]["review"]["threadSourceId"] == "src:x-thread:123456"
    assert candidates[0]["review"]["independenceKey"] == (
        "x-author:42:thread:123456"
    )


def test_import_preserves_review_work(tmp_path: Path) -> None:
    chapter_dir, backup_path = write_fixture(tmp_path)
    output_path = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    kwargs = {
        "chapter_dir": chapter_dir,
        "backup_path": backup_path,
        "output_path": output_path,
        "manifest_path": manifest_path,
        "chapters": ("physical-dysphoria", "social-dysphoria"),
    }
    import_candidates(**kwargs, imported_at=IMPORTED_AT)
    candidate = read_jsonl(output_path)[0]
    candidate["review"] = {
        "status": "approved",
        "reportType": "first_person",
        "identityBasis": "same_post_explicit",
        "excerpt": "A first-person experience",
    }
    candidate["proposedPhenomena"] = [
        {
            "relation": "suggests_claim",
            "claimSlug": None,
            "label": "An experience",
            "rationale": None,
        }
    ]
    output_path.write_text(json.dumps(candidate) + "\n", encoding="utf-8")

    import_candidates(**kwargs, imported_at="2026-08-20T00:00:00+00:00")

    refreshed = read_jsonl(output_path)[0]
    assert refreshed["review"]["status"] == "approved"
    assert refreshed["proposedPhenomena"][0]["label"] == "An experience"
    assert refreshed["discovery"]["discoveredAt"] == IMPORTED_AT


def test_refresh_rejects_changed_backup_text(tmp_path: Path) -> None:
    chapter_dir, backup_path = write_fixture(tmp_path)
    output_path = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    kwargs = {
        "chapter_dir": chapter_dir,
        "backup_path": backup_path,
        "output_path": output_path,
        "manifest_path": manifest_path,
        "chapters": ("physical-dysphoria",),
    }
    import_candidates(**kwargs, imported_at=IMPORTED_AT)
    backup = json.loads(backup_path.read_text(encoding="utf-8"))
    backup["123456"]["full_text"] = "Changed archived text"
    backup_path.write_text(json.dumps(backup), encoding="utf-8")

    with pytest.raises(ImportFailure, match="Archived source changed"):
        import_candidates(
            **kwargs,
            imported_at="2026-08-20T00:00:00+00:00",
        )


def test_import_reports_missing_backup_posts(tmp_path: Path) -> None:
    chapter_dir, backup_path = write_fixture(tmp_path)
    backup_path.write_text("{}", encoding="utf-8")
    with pytest.raises(ImportFailure, match="missing backup posts: 123456"):
        import_candidates(
            chapter_dir=chapter_dir,
            backup_path=backup_path,
            output_path=tmp_path / "candidates.jsonl",
            manifest_path=tmp_path / "manifest.json",
            chapters=("physical-dysphoria",),
            imported_at=IMPORTED_AT,
        )


def test_refresh_rejects_candidate_removal(tmp_path: Path) -> None:
    chapter_dir, backup_path = write_fixture(tmp_path)
    output_path = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    import_candidates(
        chapter_dir=chapter_dir,
        backup_path=backup_path,
        output_path=output_path,
        manifest_path=manifest_path,
        chapters=("physical-dysphoria",),
        imported_at=IMPORTED_AT,
    )
    with output_path.open("a", encoding="utf-8") as output:
        output.write(json.dumps({"candidateId": "candidate:src:x:removed"}) + "\n")

    with pytest.raises(ImportFailure, match="would remove existing candidates"):
        import_candidates(
            chapter_dir=chapter_dir,
            backup_path=backup_path,
            output_path=output_path,
            manifest_path=manifest_path,
            chapters=("physical-dysphoria",),
            imported_at="2026-08-20T00:00:00+00:00",
        )


def test_imported_candidates_match_the_schema(tmp_path: Path) -> None:
    chapter_dir, backup_path = write_fixture(tmp_path)
    output_path = tmp_path / "candidates.jsonl"
    import_candidates(
        chapter_dir=chapter_dir,
        backup_path=backup_path,
        output_path=output_path,
        manifest_path=tmp_path / "manifest.json",
        chapters=("physical-dysphoria", "social-dysphoria"),
        imported_at=IMPORTED_AT,
    )

    result = validate_ledger(output_path, Path("schemas"))
    assert result["valid"] is True
    assert result["candidateCount"] == 1
