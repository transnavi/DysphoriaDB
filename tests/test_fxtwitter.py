import pytest

from collectors.fxtwitter import (
    CollectionError,
    StatusRef,
    _tweet_from_payload,
    iter_tweet_graph,
    normalize_tweet,
    parse_status_url,
)


def test_parse_status_url() -> None:
    ref = parse_status_url("https://x.com/example_user/status/123456789")
    assert ref.handle == "example_user"
    assert ref.post_id == "123456789"


def test_normalize_quote_relation() -> None:
    tweet = {
        "id": "2",
        "url": "https://x.com/example/status/2",
        "text": "A reflection",
        "created_timestamp": 1_700_000_000,
        "lang": "en",
        "author": {"name": "Example", "screen_name": "example"},
        "quote": {"id": "1", "text": "Earlier post"},
    }
    record = normalize_tweet(
        tweet,
        retrieved_at="2026-08-18T00:00:00+00:00",
        run_id="run:test",
        seed_post_id="2",
    )
    assert record["id"] == "src:x:2"
    assert record["relations"] == [
        {"type": "quotes", "targetSourceId": "src:x:1"}
    ]


def test_iter_tweet_graph_deduplicates_quotes() -> None:
    quote = {"id": "1", "text": "Earlier post"}
    root = {"id": "2", "text": "Root", "quote": quote}
    assert [tweet["id"] for tweet in iter_tweet_graph(root)] == ["2", "1"]


def test_normalize_reply_uses_conversation_root() -> None:
    tweet = {
        "id": "3",
        "conversation_id": "1",
        "text": "A reply",
        "replying_to": {"status": "2"},
        "author": {"id": "42", "screen_name": "example"},
    }

    record = normalize_tweet(
        tweet,
        retrieved_at="2026-08-20T00:00:00+00:00",
        run_id="run:test",
        seed_post_id="3",
    )

    assert record["collection"]["seedPostId"] == "1"
    assert record["relations"] == [
        {"type": "replies_to", "targetSourceId": "src:x:2"},
        {"type": "part_of_thread", "targetSourceId": "src:x:1"},
    ]


def test_fxtwitter_rejects_mismatched_post_id() -> None:
    with pytest.raises(CollectionError, match="different post"):
        _tweet_from_payload(
            {"code": 200, "tweet": {"id": "2"}},
            StatusRef("example", "1"),
        )


def test_normalize_tweet_includes_bounded_media_alt_text() -> None:
    tweet = {
        "id": "1",
        "text": "See image",
        "author": {"screen_name": "example"},
        "media": {
            "all": [
                {
                    "type": "photo",
                    "url": "https://cdn.example/image.jpg",
                    "altText": "A first-person experience in the image",
                }
            ]
        },
    }

    source = normalize_tweet(
        tweet,
        retrieved_at="2026-08-20T00:00:00+00:00",
        run_id="run:test",
        seed_post_id="1",
    )

    assert "A first-person experience in the image" in source["text"]
    assert source["metadata"]["media"][0]["type"] == "photo"
