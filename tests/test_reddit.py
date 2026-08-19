import pytest

import collectors.reddit as reddit
from collectors.reddit import (
    CollectionError,
    RedditRef,
    canonical_url,
    normalize_item,
    normalize_permalink,
    parse_html_item,
    parse_reddit_url,
    fetch_item,
)


def test_parse_submission_url() -> None:
    ref = parse_reddit_url("https://www.reddit.com/r/example/comments/abc123/title/")
    assert ref == RedditRef(subreddit="example", post_id="abc123")
    assert ref.fullname == "t3_abc123"


def test_parse_reddit_url_rejects_lookalike_domain() -> None:
    with pytest.raises(ValueError, match="Unsupported Reddit URL"):
        parse_reddit_url("https://notreddit.com/r/example/comments/abc123/")


def test_normalize_permalink_percent_encodes_unicode_path() -> None:
    assert normalize_permalink(
        "/r/transbr/comments/abc123/olá_vocês/"
    ).endswith("/ol%C3%A1_voc%C3%AAs/")


def test_normalize_permalink_rejects_external_host() -> None:
    with pytest.raises(CollectionError, match="outside reddit.com"):
        normalize_permalink("https://example.com/r/example/comments/abc123/")


def test_parse_comment_urls() -> None:
    modern = parse_reddit_url(
        "https://www.reddit.com/r/example/comments/abc123/comment/def456/"
    )
    legacy = parse_reddit_url(
        "https://old.reddit.com/r/example/comments/abc123/title/def456/"
    )
    assert modern == legacy == RedditRef("example", "abc123", "def456")
    assert canonical_url(modern).endswith("/comments/abc123/comment/def456/")


def test_normalize_comment() -> None:
    ref = RedditRef("example", "abc123", "def456")
    source = normalize_item(
        {
            "kind": "t1",
            "data": {
                "name": "t1_def456",
                "body": "A first-person report",
                "author": "example_user",
                "created_utc": 1_700_000_000,
                "parent_id": "t3_abc123",
                "permalink": "/r/example/comments/abc123/title/def456/",
                "subreddit": "example",
                "score": 4,
            },
        },
        ref=ref,
        retrieved_at="2026-08-19T00:00:00+00:00",
        run_id="run:test",
    )
    assert source["id"] == "src:reddit:t1_def456"
    assert source["relations"] == [
        {"type": "replies_to", "targetSourceId": "src:reddit:t3_abc123"}
    ]
    assert source["author"]["handle"] == "example_user"


def test_parse_public_html_selects_only_the_requested_item() -> None:
    html = """
    <div class="thing" data-fullname="t3_abc123" data-author="op"></div>
    <div class="thing comment" data-fullname="t1_def456"
         data-author="example_user" data-subreddit="example"
         data-parent-fullname="t3_abc123"
         data-permalink="/r/example/comments/abc123/title/def456/" data-score="4">
      <div class="entry unvoted">
        <p class="tagline"><time datetime="2024-01-01T00:00:00+00:00"></time></p>
        <div class="usertext-body"><div class="md"><p>Selected report.</p></div></div>
      </div>
    </div>
    """
    item = parse_html_item(html, RedditRef("example", "abc123", "def456"))
    assert item["kind"] == "t1"
    assert item["retrievalMethod"] == "old_reddit_html"
    assert item["data"]["body"] == "Selected report."
    assert item["data"]["author"] == "example_user"
    assert item["data"]["parent_id"] == "t3_abc123"


def test_fetch_item_rejects_mismatched_fullname(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def read(self) -> bytes:
            return b'{"data":{"children":[{"kind":"t3","data":{"name":"t3_other"}}]}}'

    monkeypatch.setattr(reddit.urllib.request, "urlopen", lambda *args, **kwargs: Response())

    with pytest.raises(CollectionError, match="different public item"):
        fetch_item(RedditRef("example", "wanted"))
