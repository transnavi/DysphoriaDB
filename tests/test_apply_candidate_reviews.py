import json
from pathlib import Path

import pytest

from scripts.apply_candidate_reviews import ReviewFailure, apply_reviews
from scripts.add_public_post_candidates import write_ledger


def candidate(candidate_id: str) -> dict:
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


def test_applies_review_and_proposed_phenomenon(tmp_path: Path) -> None:
    candidate_id = "candidate:src:example:1"
    ledger = tmp_path / "ledger.jsonl"
    write_ledger(ledger, {candidate_id: candidate(candidate_id)})
    decisions = tmp_path / "decisions.json"
    decisions.write_text(
        json.dumps(
            [
                {
                    "candidateId": candidate_id,
                    "review": {
                        "status": "in_review",
                        "reportType": "first_person",
                    },
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

    result = apply_reviews(
        ledger_path=ledger,
        decisions_path=decisions,
        schema_dir=Path("schemas"),
    )

    updated = json.loads(ledger.read_text(encoding="utf-8"))
    assert result["reviewStatuses"] == {"in_review": 1}
    assert updated["review"]["reportType"] == "first_person"
    assert updated["proposedPhenomena"][0]["label"] == "A candidate experience"


def test_rejects_unknown_candidate_without_writing(tmp_path: Path) -> None:
    candidate_id = "candidate:src:example:1"
    ledger = tmp_path / "ledger.jsonl"
    write_ledger(ledger, {candidate_id: candidate(candidate_id)})
    original = ledger.read_text(encoding="utf-8")
    decisions = tmp_path / "decisions.json"
    decisions.write_text(
        json.dumps([{"candidateId": "candidate:src:example:missing"}]),
        encoding="utf-8",
    )

    with pytest.raises(ReviewFailure, match="Unknown candidate IDs"):
        apply_reviews(
            ledger_path=ledger,
            decisions_path=decisions,
            schema_dir=Path("schemas"),
        )
    assert ledger.read_text(encoding="utf-8") == original


def test_resolves_decision_by_unique_source_url(tmp_path: Path) -> None:
    candidate_id = "candidate:src:example:1"
    ledger = tmp_path / "ledger.jsonl"
    write_ledger(ledger, {candidate_id: candidate(candidate_id)})
    decisions = tmp_path / "decisions.json"
    decisions.write_text(
        json.dumps(
            [
                {
                    "sourceUrl": "https://example.com/1",
                    "review": {
                        "status": "in_review",
                        "reportType": "first_person",
                    },
                }
            ]
        ),
        encoding="utf-8",
    )

    apply_reviews(
        ledger_path=ledger,
        decisions_path=decisions,
        schema_dir=Path("schemas"),
    )

    updated = json.loads(ledger.read_text(encoding="utf-8"))
    assert updated["review"]["status"] == "in_review"
