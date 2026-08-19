import json
from pathlib import Path

from scripts.add_public_post_candidates import write_ledger
from scripts.migrate_article_excerpt_ids import migrate_article_excerpt_ids


def article_candidate() -> dict:
    candidate_id = "candidate:src:web-article:note:base"
    return {
        "schemaVersion": "0.1.0",
        "candidateId": candidate_id,
        "source": {
            "schemaVersion": "0.1.0",
            "id": "src:web-article:note:base",
            "sourceType": "blog_post",
            "platform": "note",
            "nativeId": "base",
            "url": "https://note.com/example/n/one",
            "publishedAt": None,
            "retrievedAt": "2026-08-20T00:00:00+00:00",
            "language": "ja",
            "text": "Selected excerpt",
            "contentHash": "d" * 64,
            "relations": [],
            "collection": {
                "collector": "public_article_excerpt",
                "collectorVersion": "0.1.0",
                "runId": "run:test",
            },
            "metadata": {"excerptAnchors": ["selected"]},
        },
        "discovery": {
            "method": "public_keyword_search",
            "sourceUrls": ["https://note.com/example/n/one"],
            "discoveredAt": "2026-08-20T00:00:00+00:00",
        },
        "proposedPhenomena": [],
        "review": {
            "status": "pending",
            "reportType": "first_person_summary",
            "identityBasis": "same_post_explicit",
        },
        "availability": {
            "status": "public",
            "checkedAt": "2026-08-20T00:00:00+00:00",
        },
        "publication": {"status": "unpublished", "publishedAt": None},
    }


def test_migrates_article_to_anchor_specific_id(tmp_path: Path) -> None:
    ledger = tmp_path / "ledger.jsonl"
    value = article_candidate()
    write_ledger(ledger, {value["candidateId"]: value})

    result = migrate_article_excerpt_ids(
        ledger_path=ledger,
        schema_dir=Path("schemas"),
    )

    updated = json.loads(ledger.read_text(encoding="utf-8"))
    assert result["migratedCount"] == 1
    assert updated["candidateId"] == f"candidate:{updated['source']['id']}"
    assert updated["source"]["metadata"]["excerptKey"]
    assert updated["source"]["nativeId"].count(":") == 1
