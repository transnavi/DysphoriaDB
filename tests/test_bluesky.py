import pytest

import collectors.bluesky as bluesky
from collectors.bluesky import BlueskyRef, CollectionError, fetch_post, normalize_post, parse_bluesky_url


def test_parse_bluesky_url() -> None:
    ref = parse_bluesky_url(
        "https://bsky.app/profile/example.bsky.social/post/3example"
    )
    assert ref == BlueskyRef("example.bsky.social", "3example")


def test_normalize_bluesky_reply() -> None:
    ref = BlueskyRef("example.bsky.social", "3child")
    source = normalize_post(
        {
            "uri": "at://did:plc:author/app.bsky.feed.post/3child",
            "cid": "bafy-child",
            "author": {
                "did": "did:plc:author",
                "handle": "example.bsky.social",
                "displayName": "Example",
            },
            "record": {
                "text": "A first-person experience",
                "createdAt": "2026-05-14T00:00:00.000Z",
                "langs": ["ja"],
                "reply": {
                    "parent": {
                        "uri": "at://did:plc:parent/app.bsky.feed.post/3parent"
                    },
                    "root": {
                        "uri": "at://did:plc:root/app.bsky.feed.post/3root"
                    }
                },
            },
            "likeCount": 2,
            "repostCount": 1,
            "replyCount": 0,
            "quoteCount": 0,
        },
        ref=ref,
        retrieved_at="2026-08-19T00:00:00+00:00",
        run_id="run:test",
    )
    assert source["id"] == "src:bluesky:did:plc:author:3child"
    assert source["language"] == "ja"
    assert source["relations"] == [
        {
            "type": "replies_to",
            "targetSourceId": "src:bluesky:did:plc:parent:3parent",
        },
        {
            "type": "part_of_thread",
            "targetSourceId": "src:bluesky:did:plc:root:3root",
        },
    ]
    assert source["metadata"]["rootUri"] == (
        "at://did:plc:root/app.bsky.feed.post/3root"
    )


def test_fetch_post_rejects_mismatched_uri(monkeypatch: pytest.MonkeyPatch) -> None:
    responses = iter(
        [
            {"did": "did:plc:author"},
            {
                "posts": [
                    {"uri": "at://did:plc:other/app.bsky.feed.post/3other"}
                ]
            },
        ]
    )
    monkeypatch.setattr(bluesky, "_get_json", lambda *args, **kwargs: next(responses))

    with pytest.raises(CollectionError, match="different post"):
        fetch_post(BlueskyRef("example.bsky.social", "3wanted"))


def test_normalize_bluesky_quote_and_image_alt_text() -> None:
    source = normalize_post(
        {
            "uri": "at://did:plc:author/app.bsky.feed.post/3post",
            "author": {"did": "did:plc:author", "handle": "example.test"},
            "record": {"text": "See image", "createdAt": None},
            "embed": {
                "record": {
                    "uri": "at://did:plc:quoted/app.bsky.feed.post/3quoted"
                },
                "images": [
                    {
                        "alt": "A bounded experience description",
                        "fullsize": "https://cdn.example/image.jpg",
                    }
                ],
            },
        },
        ref=BlueskyRef("example.test", "3post"),
        retrieved_at="2026-08-20T00:00:00+00:00",
        run_id="run:test",
    )

    assert {"type": "quotes", "targetSourceId": "src:bluesky:did:plc:quoted:3quoted"} in source["relations"]
    assert "A bounded experience description" in source["text"]
    assert source["metadata"]["media"][0]["mediaIdentityHash"]
