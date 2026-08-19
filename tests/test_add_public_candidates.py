from pathlib import Path

import pytest

from collectors.public_article import article_source_identity
import scripts.add_public_post_candidates as post_candidates
from scripts.add_public_post_candidates import (
    retain_source_url,
    source_snapshot_changed,
)


def article_source(*, anchors: list[str], content_hash: str = "a" * 64) -> dict:
    return {
        "id": "src:web-article:note:base",
        "nativeId": "base",
        "contentHash": content_hash,
        "metadata": {"excerptAnchors": anchors},
    }


def test_article_anchor_set_gets_a_distinct_source_identity() -> None:
    first, _ = article_source_identity("https://note.com/example/n/one", ["first"])
    second, _ = article_source_identity("https://note.com/example/n/one", ["second"])

    assert first != second


def test_article_source_identity_is_anchor_order_invariant() -> None:
    first = article_source_identity(
        "https://note.com/example/n/one", ["First", "second"]
    )
    second = article_source_identity(
        "https://note.com/example/n/one", ["second", "first"]
    )

    assert first == second


def test_source_snapshot_change_is_detected() -> None:
    prior = {"source": article_source(anchors=["first"], content_hash="a" * 64)}
    current = article_source(anchors=["first"], content_hash="b" * 64)

    assert source_snapshot_changed(prior, current) is True


def test_source_url_history_is_retained() -> None:
    discovery = {"sourceUrls": ["https://example.com/old"]}
    retain_source_url(discovery, "https://example.com/new")
    retain_source_url(discovery, "https://example.com/new")

    assert discovery["sourceUrls"] == [
        "https://example.com/old",
        "https://example.com/new",
    ]


def test_invalid_candidate_batch_is_not_written(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    source = {
        "schemaVersion": "0.1.0",
        "id": "src:reddit:t3_one",
        "sourceType": "social_post",
        "platform": "reddit",
        "nativeId": "t3_one",
        "url": "https://www.reddit.com/r/example/comments/one/",
        "author": {},
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
            "seedPostId": "one",
        },
        "metadata": {"postId": "one"},
    }
    monkeypatch.setattr(post_candidates, "fetch_source", lambda *args, **kwargs: source)
    ledger = tmp_path / "ledger.jsonl"

    with pytest.raises(ValueError, match="Candidate ledger failed validation"):
        post_candidates.add_candidates(
            ["https://www.reddit.com/r/example/comments/one/"],
            phenomenon="Example",
            relation="supports_claim",
            claim_slug=None,
            method="direct_public_post",
            query=None,
            query_language="en",
            context=None,
            output_path=ledger,
            manifest_path=tmp_path / "manifest.json",
            retrieved_at="2026-08-20T00:00:00+00:00",
        )

    assert ledger.exists() is False
