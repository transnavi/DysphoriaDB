import json
from pathlib import Path

import pytest

from scripts.import_gdb_passages import ImportFailure, import_passages


def write_fixture(root: Path) -> Path:
    chapter_dir = root / "public" / "en"
    chapter_dir.mkdir(parents=True)
    (chapter_dir / "sample.md").write_text(
        """---
date: "2020-01-26T20:41:55.827Z"
---

# Sample Chapter

Introductory text.

### A Specific Experience

The first selected line.
The second selected line.
""",
        encoding="utf-8",
    )
    return root


def test_imports_exact_passage_with_section_metadata(tmp_path: Path) -> None:
    gdb_root = write_fixture(tmp_path / "gdb")
    specs = tmp_path / "specs.json"
    specs.write_text(
        json.dumps(
            [
                {
                    "chapter": "sample",
                    "lineStart": 11,
                    "lineEnd": 12,
                    "proposedPhenomena": [
                        {
                            "relation": "suggests_claim",
                            "claimSlug": None,
                            "label": "A candidate experience",
                            "rationale": None,
                        }
                    ],
                }
            ]
        ),
        encoding="utf-8",
    )
    output = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"

    manifest = import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:00:00+00:00",
    )

    candidate = json.loads(output.read_text(encoding="utf-8"))
    assert manifest["candidateCount"] == 1
    assert candidate["source"]["text"] == (
        "The first selected line.\nThe second selected line."
    )
    assert candidate["source"]["metadata"]["section"] == "A Specific Experience"
    assert candidate["source"]["url"].endswith("#a-specific-experience")
    assert candidate["review"]["reportType"] == "general_discourse"


def test_refresh_preserves_review_decision(tmp_path: Path) -> None:
    gdb_root = write_fixture(tmp_path / "gdb")
    specs = tmp_path / "specs.json"
    specs.write_text(
        json.dumps(
            [
                {
                    "chapter": "sample",
                    "lineStart": 11,
                    "lineEnd": 11,
                    "proposedPhenomena": [],
                }
            ]
        ),
        encoding="utf-8",
    )
    output = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:00:00+00:00",
    )
    candidate = json.loads(output.read_text(encoding="utf-8"))
    candidate["review"] = {
        "status": "approved",
        "reportType": "first_person_summary",
        "identityBasis": "not_required",
    }
    output.write_text(json.dumps(candidate) + "\n", encoding="utf-8")

    import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:01:00+00:00",
    )

    refreshed = json.loads(output.read_text(encoding="utf-8"))
    assert refreshed["review"]["status"] == "approved"


def test_refresh_preserves_reviewer_added_phenomenon(tmp_path: Path) -> None:
    gdb_root = write_fixture(tmp_path / "gdb")
    specs = tmp_path / "specs.json"
    specs.write_text(
        json.dumps(
            [
                {
                    "chapter": "sample",
                    "lineStart": 11,
                    "lineEnd": 11,
                    "proposedPhenomena": [],
                }
            ]
        ),
        encoding="utf-8",
    )
    output = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:00:00+00:00",
    )
    candidate = json.loads(output.read_text(encoding="utf-8"))
    candidate["proposedPhenomena"] = [
        {
            "relation": "suggests_claim",
            "claimSlug": None,
            "label": "Reviewer-added phenomenon",
            "rationale": None,
        }
    ]
    output.write_text(json.dumps(candidate) + "\n", encoding="utf-8")

    import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:01:00+00:00",
    )

    refreshed = json.loads(output.read_text(encoding="utf-8"))
    assert refreshed["proposedPhenomena"][0]["label"] == (
        "Reviewer-added phenomenon"
    )


def test_refresh_rejects_changed_passage(tmp_path: Path) -> None:
    gdb_root = write_fixture(tmp_path / "gdb")
    specs = tmp_path / "specs.json"
    specs.write_text(
        json.dumps(
            [
                {
                    "chapter": "sample",
                    "lineStart": 11,
                    "lineEnd": 11,
                    "proposedPhenomena": [],
                }
            ]
        ),
        encoding="utf-8",
    )
    output = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:00:00+00:00",
    )
    chapter = gdb_root / "public" / "en" / "sample.md"
    chapter.write_text(
        chapter.read_text(encoding="utf-8").replace(
            "The first selected line.", "A changed selected line."
        ),
        encoding="utf-8",
    )

    with pytest.raises(ImportFailure, match="passage changed"):
        import_passages(
            gdb_root=gdb_root,
            specs_path=specs,
            output_path=output,
            manifest_path=manifest_path,
            imported_at="2026-08-20T00:01:00+00:00",
        )


def test_refresh_rejects_candidate_removal(tmp_path: Path) -> None:
    gdb_root = write_fixture(tmp_path / "gdb")
    specs = tmp_path / "specs.json"
    specs.write_text(
        json.dumps(
            [
                {
                    "chapter": "sample",
                    "lineStart": 11,
                    "lineEnd": 11,
                    "proposedPhenomena": [],
                }
            ]
        ),
        encoding="utf-8",
    )
    output = tmp_path / "candidates.jsonl"
    manifest_path = tmp_path / "manifest.json"
    import_passages(
        gdb_root=gdb_root,
        specs_path=specs,
        output_path=output,
        manifest_path=manifest_path,
        imported_at="2026-08-20T00:00:00+00:00",
    )
    with output.open("a", encoding="utf-8") as ledger:
        ledger.write(json.dumps({"candidateId": "candidate:src:gdb-passage:removed"}) + "\n")

    with pytest.raises(ImportFailure, match="would remove existing candidates"):
        import_passages(
            gdb_root=gdb_root,
            specs_path=specs,
            output_path=output,
            manifest_path=manifest_path,
            imported_at="2026-08-20T00:01:00+00:00",
        )
