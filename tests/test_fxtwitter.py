from collectors.fxtwitter import iter_tweet_graph, normalize_tweet, parse_status_url


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
