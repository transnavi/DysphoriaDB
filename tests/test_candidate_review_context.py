import json
from pathlib import Path

import pytest

from scripts.add_public_post_candidates import (
    read_ledger,
    review_defaults_for_source,
    write_ledger,
)
from scripts.backfill_candidate_review_context import backfill_review_context


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


def reddit_source(author: str, comment_id: str) -> dict:
    value = candidate(f"candidate:src:reddit:t1_{comment_id}")["source"]
    value.update(
        {
            "id": f"src:reddit:t1_{comment_id}",
            "platform": "reddit",
            "nativeId": f"t1_{comment_id}",
            "url": f"https://www.reddit.com/r/example/comments/abc/comment/{comment_id}/",
            "author": {"handle": author},
            "metadata": {"postId": "abc"},
        }
    )
    return value


def test_reddit_comments_share_author_thread_independence_key() -> None:
    first = review_defaults_for_source(reddit_source("same_author", "one"))
    second = review_defaults_for_source(reddit_source("same_author", "two"))

    assert first["threadSourceId"] == "src:reddit-thread:abc"
    assert first["independenceKey"] == second["independenceKey"]


def test_bluesky_uses_root_thread_for_independence() -> None:
    source = candidate("candidate:src:bluesky:one")["source"]
    source.update(
        {
            "platform": "bluesky",
            "nativeId": "at://did:plc:author/app.bsky.feed.post/3child",
            "author": {"nativeId": "did:plc:author"},
            "metadata": {
                "rootUri": "at://did:plc:root/app.bsky.feed.post/3root"
            },
        }
    )

    review = review_defaults_for_source(source)

    assert review["threadSourceId"] == "src:bluesky-thread:did:plc:root:3root"
    assert review["independenceKey"].endswith(
        "did:plc:author:thread:did:plc:root:3root"
    )


def test_unknown_author_does_not_get_a_shared_independence_key() -> None:
    source = reddit_source("", "one")
    source["author"] = {}

    review = review_defaults_for_source(source)

    assert "independenceKey" not in review
    assert review["threadSourceId"] == "src:reddit-thread:abc"


def test_backfill_preserves_review_decisions(tmp_path: Path) -> None:
    candidate_id = "candidate:src:reddit:t1_one"
    value = candidate(candidate_id)
    value["source"] = reddit_source("same_author", "one")
    value["review"] = {
        "status": "approved",
        "reportType": "first_person",
        "identityBasis": "same_thread_explicit",
    }
    ledger = tmp_path / "ledger.jsonl"
    write_ledger(ledger, {candidate_id: value})

    result = backfill_review_context(
        ledger_path=ledger,
        schema_dir=Path("schemas"),
    )

    updated = json.loads(ledger.read_text(encoding="utf-8"))
    assert result["changedCandidateCount"] == 1
    assert updated["review"]["status"] == "approved"
    assert updated["review"]["reportType"] == "first_person"
    assert updated["review"]["threadSourceId"] == "src:reddit-thread:abc"


def test_read_ledger_rejects_duplicate_candidate_ids(tmp_path: Path) -> None:
    candidate_id = "candidate:src:example:1"
    line = json.dumps(candidate(candidate_id)) + "\n"
    ledger = tmp_path / "ledger.jsonl"
    ledger.write_text(line + line, encoding="utf-8")

    with pytest.raises(ValueError, match="Duplicate candidateId"):
        read_ledger(ledger)


def test_backfill_removes_legacy_unknown_independence_key(tmp_path: Path) -> None:
    candidate_id = "candidate:src:reddit:t1_one"
    value = candidate(candidate_id)
    value["source"] = reddit_source("", "one")
    value["source"]["author"] = {}
    value["review"]["independenceKey"] = "reddit-author:unknown:thread:abc"
    ledger = tmp_path / "ledger.jsonl"
    write_ledger(ledger, {candidate_id: value})

    backfill_review_context(ledger_path=ledger, schema_dir=Path("schemas"))

    updated = json.loads(ledger.read_text(encoding="utf-8"))
    assert "independenceKey" not in updated["review"]
