"""Capture selected excerpts from supported public article platforms."""

from __future__ import annotations

import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Iterable

from bs4 import BeautifulSoup, Tag


COLLECTOR_NAME = "public_article_excerpt"
COLLECTOR_VERSION = "0.1.0"


class CollectionError(RuntimeError):
    """Raised when a public article or its selected excerpt cannot be captured."""


@dataclass(frozen=True)
class ArticleRef:
    url: str
    platform: str
    source_type: str
    body_selector: str


PLATFORMS = {
    "note.com": ("note", "blog_post", "div[data-name='body']"),
    "ameblo.jp": ("ameblo", "blog_post", "#entryBody"),
    "www.ameblo.jp": ("ameblo", "blog_post", "#entryBody"),
    "lgbter.jp": ("lgbter", "article", ".detail-box-in"),
    "www.lgbter.jp": ("lgbter", "article", ".detail-box-in"),
}


def article_source_identity(url: str, anchors: Iterable[str]) -> tuple[str, str]:
    article_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:20]
    normalized_anchors = sorted({
        anchor.casefold().strip() for anchor in anchors if anchor.strip()
    })
    excerpt_key = hashlib.sha256(
        "\n".join(normalized_anchors).encode("utf-8")
    ).hexdigest()[:12]
    return f"{article_id}:{excerpt_key}", excerpt_key


def parse_article_url(url: str) -> ArticleRef:
    parsed = urllib.parse.urlparse(url.strip())
    hostname = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or hostname not in PLATFORMS:
        raise ValueError(f"Unsupported public article URL: {url}")
    if parsed.username or parsed.password or parsed.port:
        raise ValueError(f"Unsupported public article URL: {url}")
    platform, source_type, selector = PLATFORMS[hostname]
    canonical = urllib.parse.urlunparse(
        parsed._replace(fragment="", query="", netloc=hostname)
    )
    return ArticleRef(canonical, platform, source_type, selector)


def fetch_html(ref: ArticleRef, timeout: float = 20.0) -> tuple[str, ArticleRef]:
    request = urllib.request.Request(
        ref.url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "GenderExperienceIndex/0.1 source collector",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            html = response.read().decode("utf-8", errors="replace")
            final_ref = parse_article_url(response.geturl())
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        raise CollectionError(f"Public article request failed: {error}") from error
    except ValueError as error:
        raise CollectionError(f"Public article redirected outside supported hosts: {error}") from error
    return html, final_ref


def _json_ld_articles(document: BeautifulSoup) -> Iterable[dict[str, Any]]:
    for script in document.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            value = json.loads(script.get_text())
        except (json.JSONDecodeError, TypeError):
            continue
        values = value if isinstance(value, list) else [value]
        for item in values:
            if not isinstance(item, dict):
                continue
            graph = item.get("@graph")
            candidates = graph if isinstance(graph, list) else [item]
            for candidate in candidates:
                if not isinstance(candidate, dict):
                    continue
                item_type = candidate.get("@type")
                types = item_type if isinstance(item_type, list) else [item_type]
                if any(
                    value in {"Article", "BlogPosting", "NewsArticle"}
                    for value in types
                ):
                    yield candidate


def _meta_content(document: BeautifulSoup, *selectors: str) -> str | None:
    for selector in selectors:
        element = document.select_one(selector)
        if element and element.get("content"):
            return str(element["content"]).strip() or None
    return None


def _article_metadata(document: BeautifulSoup) -> dict[str, Any]:
    article = next(iter(_json_ld_articles(document)), {})
    author = article.get("author") if isinstance(article.get("author"), dict) else {}
    title = str(article.get("headline") or "").strip() or _meta_content(
        document, "meta[property='og:title']", "meta[name='twitter:title']"
    )
    published_at = str(article.get("datePublished") or "").strip() or _meta_content(
        document, "meta[property='article:published_time']"
    )
    return {
        "title": title,
        "publishedAt": published_at,
        "authorName": str(author.get("name") or "").strip() or None,
        "authorUrl": str(author.get("url") or "").strip() or None,
    }


def _normalize_datetime(value: str | None, platform: str) -> str | None:
    if not value:
        return None
    candidate = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(candidate).isoformat()
    except ValueError:
        pass
    match = re.search(r"(?P<year>\d{4})[/-](?P<month>\d{1,2})[/-](?P<day>\d{1,2})", candidate)
    if not match:
        return None
    offset = "+09:00" if platform in {"note", "ameblo", "lgbter"} else "+00:00"
    return (
        f"{int(match.group('year')):04d}-{int(match.group('month')):02d}-"
        f"{int(match.group('day')):02d}T00:00:00{offset}"
    )


def _block_texts(body: Tag) -> list[str]:
    for unwanted in body.select("script, style, noscript, svg, form, button"):
        unwanted.decompose()
    blocks: list[str] = []
    for element in body.select("h2, h3, h4, p, blockquote, li"):
        text = re.sub(r"\s+", " ", element.get_text(" ", strip=True)).strip()
        if text and (not blocks or blocks[-1] != text):
            blocks.append(text)
    if not blocks:
        text = re.sub(r"\s+", " ", body.get_text(" ", strip=True)).strip()
        if text:
            blocks.append(text)
    return blocks


def select_excerpt(
    blocks: list[str],
    anchors: Iterable[str],
    *,
    context_blocks: int = 1,
    max_characters: int = 2400,
) -> tuple[str, list[int]]:
    normalized_anchors = [anchor.casefold().strip() for anchor in anchors if anchor.strip()]
    if not normalized_anchors:
        raise CollectionError("At least one excerpt anchor is required")
    matches = {
        index
        for index, block in enumerate(blocks)
        if any(anchor in block.casefold() for anchor in normalized_anchors)
    }
    if not matches:
        raise CollectionError("No excerpt anchor was found in the article body")
    selected = sorted(
        {
            nearby
            for index in matches
            for nearby in range(
                max(0, index - context_blocks),
                min(len(blocks), index + context_blocks + 1),
            )
        }
    )
    kept: list[int] = []
    text_blocks: list[str] = []
    length = 0
    for index in selected:
        block = blocks[index]
        added = len(block) + (2 if text_blocks else 0)
        if text_blocks and length + added > max_characters:
            continue
        if not text_blocks and len(block) > max_characters:
            block = block[: max_characters - 1].rstrip() + "…"
            added = len(block)
        text_blocks.append(block)
        kept.append(index)
        length += added
    return "\n\n".join(text_blocks), kept


def normalize_article(
    html: str,
    *,
    ref: ArticleRef,
    anchors: Iterable[str],
    language: str,
    retrieved_at: str,
    run_id: str,
) -> dict[str, Any]:
    anchor_list = list(anchors)
    document = BeautifulSoup(html, "html.parser")
    body = document.select_one(ref.body_selector)
    if body is None:
        raise CollectionError(
            f"No supported article body found for {ref.platform}"
        )
    blocks = _block_texts(body)
    full_text = "\n\n".join(blocks)
    excerpt, selected_indexes = select_excerpt(blocks, anchor_list)
    metadata = _article_metadata(document)
    native_id, excerpt_key = article_source_identity(ref.url, anchor_list)
    article_native_id = native_id.split(":", 1)[0]
    source_id = f"src:web-article:{ref.platform}:{native_id}"
    author_url = metadata["authorUrl"]
    if author_url:
        parsed_author = urllib.parse.urlparse(author_url)
        if parsed_author.scheme not in {"http", "https"}:
            author_url = None

    return {
        "schemaVersion": "0.1.0",
        "id": source_id,
        "sourceType": ref.source_type,
        "platform": ref.platform,
        "nativeId": native_id,
        "url": ref.url,
        "author": {
            "displayName": metadata["authorName"],
            "handle": None,
            "nativeId": None,
            "url": author_url,
        },
        "publishedAt": _normalize_datetime(metadata["publishedAt"], ref.platform),
        "retrievedAt": retrieved_at,
        "language": language,
        "text": excerpt,
        "contentHash": hashlib.sha256(excerpt.encode("utf-8")).hexdigest(),
        "relations": [],
        "collection": {
            "collector": COLLECTOR_NAME,
            "collectorVersion": COLLECTOR_VERSION,
            "runId": run_id,
        },
        "metadata": {
            "title": metadata["title"],
            "captureScope": "selected_excerpt",
            "articleNativeId": article_native_id,
            "excerptKey": excerpt_key,
            "excerptAnchors": anchor_list,
            "selectedBlockIndexes": selected_indexes,
            "fullBodyCharacterCount": len(full_text),
            "fullBodyContentHash": hashlib.sha256(
                full_text.encode("utf-8")
            ).hexdigest(),
        },
    }
