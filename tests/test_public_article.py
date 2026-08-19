import json

import pytest

from collectors.public_article import (
    CollectionError,
    normalize_article,
    parse_article_url,
    select_excerpt,
)


def test_parse_article_url_allows_supported_hosts() -> None:
    assert parse_article_url("https://note.com/example/n/abc#part").platform == "note"
    assert parse_article_url("https://ameblo.jp/example/entry-1.html").platform == "ameblo"
    assert parse_article_url("https://lgbter.jp/example/").source_type == "article"


@pytest.mark.parametrize(
    "url",
    [
        "http://note.com/example/n/abc",
        "https://evil.example/article",
        "https://note.com.evil.example/article",
    ],
)
def test_parse_article_url_rejects_unsupported_urls(url: str) -> None:
    with pytest.raises(ValueError, match="Unsupported public article URL"):
        parse_article_url(url)


def test_select_excerpt_requires_matching_anchor() -> None:
    with pytest.raises(CollectionError, match="No excerpt anchor"):
        select_excerpt(["First", "Second"], ["missing"])


def test_normalize_note_article_captures_bounded_excerpt() -> None:
    metadata = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "A public account",
        "datePublished": "2026-01-20T13:12:44+09:00",
        "author": {
            "@type": "Person",
            "name": "Example",
            "url": "https://note.com/example",
        },
    }
    html = f"""
    <html><head><script type="application/ld+json">{json.dumps(metadata)}</script></head>
    <body><div data-name="body" class="note-common-styles__textnote-body">
      <p>Unrelated opening.</p>
      <h3>Recognition</h3>
      <p>Transition made my earlier dysphoria legible.</p>
      <p>Nearby explanatory context.</p>
      <p>Unrelated ending.</p>
    </div></body></html>
    """
    source = normalize_article(
        html,
        ref=parse_article_url("https://note.com/example/n/abc"),
        anchors=["earlier dysphoria"],
        language="en",
        retrieved_at="2026-08-20T00:00:00+00:00",
        run_id="run:test",
    )
    assert source["platform"] == "note"
    assert "Transition made my earlier dysphoria legible." in source["text"]
    assert "Unrelated opening." not in source["text"]
    assert source["metadata"]["captureScope"] == "selected_excerpt"
    assert source["metadata"]["fullBodyCharacterCount"] > len(source["text"])
