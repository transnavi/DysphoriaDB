import json
from pathlib import Path

from scripts.validate_source_candidates import validate_ledger, validate_ledgers


def candidate(candidate_id: str = "candidate:src:example:1") -> dict:
    source_id = candidate_id.removeprefix("candidate:")
    return {
        "schemaVersion": "0.1.0",
        "candidateId": candidate_id,
        "source": {
            "schemaVersion": "0.1.0",
            "id": source_id,
            "sourceType": "social_post",
            "platform": "example",
            "nativeId": "1",
            "url": "https://example.com/1",
            "publishedAt": None,
            "retrievedAt": "2026-08-20T00:00:00+00:00",
            "language": "en",
            "text": "Example",
            "contentHash": "d" * 64,
            "relations": [],
            "collection": {
                "collector": "test",
                "collectorVersion": "0.1.0",
                "runId": "run:test",
            },
        },
        "discovery": {
            "method": "direct_public_post",
            "sourceUrls": ["https://example.com/1"],
            "discoveredAt": "2026-08-20T00:00:00+00:00",
        },
        "proposedPhenomena": [],
        "review": {
            "status": "pending",
            "reportType": "unknown",
            "identityBasis": "unknown",
        },
        "availability": {
            "status": "public",
            "checkedAt": "2026-08-20T00:00:00+00:00",
        },
        "publication": {"status": "unpublished", "publishedAt": None},
    }


def write_candidate(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value) + "\n", encoding="utf-8")


def test_candidate_id_must_match_source_id(tmp_path: Path) -> None:
    ledger = tmp_path / "ledger.jsonl"
    value = candidate("candidate:src:example:wrong")
    value["source"]["id"] = "src:example:1"
    write_candidate(ledger, value)

    result = validate_ledger(ledger, Path("schemas"))

    assert result["valid"] is False
    assert "candidateId must equal candidate:source.id" in result["errors"][0]


def test_duplicate_must_reference_an_existing_candidate(tmp_path: Path) -> None:
    value = candidate()
    value["review"].update(
        {
            "status": "duplicate",
            "duplicateOf": "candidate:src:example:missing",
        }
    )
    ledger = tmp_path / "ledger.jsonl"
    write_candidate(ledger, value)

    result = validate_ledger(ledger, Path("schemas"))

    assert result["valid"] is False
    assert any("duplicateOf does not exist" in error for error in result["errors"])


def test_published_candidate_must_be_approved(tmp_path: Path) -> None:
    value = candidate()
    value["publication"] = {
        "status": "published",
        "publishedAt": "2026-08-20T00:00:00+00:00",
    }
    ledger = tmp_path / "ledger.jsonl"
    write_candidate(ledger, value)

    result = validate_ledger(ledger, Path("schemas"))

    assert result["valid"] is False
    assert any("'approved' was expected" in error for error in result["errors"])


def test_same_basename_ledgers_still_report_cross_duplicate(tmp_path: Path) -> None:
    first = tmp_path / "first" / "ledger.jsonl"
    second = tmp_path / "second" / "ledger.jsonl"
    first.parent.mkdir()
    second.parent.mkdir()
    value = candidate()
    write_candidate(first, value)
    write_candidate(second, value)

    result = validate_ledgers([first, second], Path("schemas"))

    assert result["valid"] is False
    assert len(result["crossLedgerDuplicates"]) == 1
    assert result["crossLedgerDuplicates"][0]["firstLedger"].startswith(
        "ledger[1]:"
    )


def test_duplicate_can_reference_candidate_in_another_ledger(
    tmp_path: Path,
) -> None:
    first = tmp_path / "first.jsonl"
    second = tmp_path / "second.jsonl"
    target = candidate("candidate:src:example:target")
    duplicate = candidate("candidate:src:example:duplicate")
    duplicate["review"].update(
        {
            "status": "duplicate",
            "duplicateOf": target["candidateId"],
        }
    )
    write_candidate(first, target)
    write_candidate(second, duplicate)

    result = validate_ledgers([first, second], Path("schemas"))

    assert result["valid"] is True


def test_independence_clusters_are_nonfatal_review_diagnostics(
    tmp_path: Path,
) -> None:
    first = candidate("candidate:src:example:first")
    second = candidate("candidate:src:example:second")
    first["review"]["independenceKey"] = "author:one:thread:one"
    second["review"]["independenceKey"] = "author:one:thread:one"
    ledger = tmp_path / "ledger.jsonl"
    ledger.write_text(
        json.dumps(first) + "\n" + json.dumps(second) + "\n",
        encoding="utf-8",
    )

    result = validate_ledger(ledger, Path("schemas"))

    assert result["valid"] is True
    assert result["reviewDiagnostics"]["independenceClusters"] == [
        {
            "independenceKey": "author:one:thread:one",
            "candidateIds": [first["candidateId"], second["candidateId"]],
        }
    ]
