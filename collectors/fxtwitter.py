"""Capture public X posts through the FxTwitter API."""

from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Iterator


COLLECTOR_NAME = "fxtwitter"
COLLECTOR_VERSION = "0.2.0"
API_ROOT = "https://api.fxtwitter.com"
STATUS_RE = re.compile(
    r"https?://(?:www\.)?(?:x|twitter|fixupx|fxtwitter)\.com/"
    r"(?P<handle>[A-Za-z0-9_]+)/status/(?P<id>\d+)"
)


class CollectionError(RuntimeError):
    """Raised when a source cannot be retrieved or parsed."""


@dataclass(frozen=True)
class StatusRef:
    handle: str
    post_id: str


def parse_status_url(url: str) -> StatusRef:
    match = STATUS_RE.search(url.strip())
    if match is None:
        raise ValueError(f"Unsupported X status URL: {url}")
    return StatusRef(handle=match.group("handle"), post_id=match.group("id"))


def api_url(ref: StatusRef) -> str:
    return f"{API_ROOT}/{ref.handle}/status/{ref.post_id}"


def _tweet_from_payload(payload: dict[str, Any], ref: StatusRef) -> dict[str, Any]:
    tweet = payload.get("tweet")
    if payload.get("code") != 200 or not isinstance(tweet, dict):
        message = payload.get("message", "missing tweet object")
        raise CollectionError(
            f"FxTwitter returned an invalid response for {ref.post_id}: {message}"
        )
    if str(tweet.get("id") or "") != ref.post_id:
        raise CollectionError(
            f"FxTwitter returned a different post for {ref.post_id}"
        )
    return tweet


def fetch_status(ref: StatusRef, timeout: float = 20.0) -> dict[str, Any]:
    request = urllib.request.Request(
        api_url(ref),
        headers={
            "Accept": "application/json",
            "User-Agent": "GenderExperienceIndex/0.1 source collector",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        raise CollectionError(f"FxTwitter request failed for {ref.post_id}: {error}") from error

    _tweet_from_payload(payload, ref)
    return payload


def _fetch_api_page(path: str, params: dict[str, str], timeout: float) -> dict[str, Any]:
    url = f"{API_ROOT}{path}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "GenderExperienceIndex/0.1 source collector",
        },
    )
    error: Exception | None = None
    payload: dict[str, Any] = {}
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                payload = json.load(response)
            break
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as caught:
            error = caught
            if attempt < 3:
                time.sleep(0.5 * (attempt + 1))
    else:
        raise CollectionError(f"FxTwitter request failed: {error}") from error
    if payload.get("code") != 200:
        raise CollectionError(payload.get("message", "FxTwitter returned an invalid response"))
    return payload


def fetch_conversation_page(
    post_id: str,
    *,
    cursor: str | None = None,
    ranking_mode: str = "likes",
    timeout: float = 30.0,
) -> dict[str, Any]:
    params = {"ranking_mode": ranking_mode}
    if cursor:
        params["cursor"] = cursor
    return _fetch_api_page(f"/2/conversation/{post_id}", params, timeout)


def fetch_quotes_page(
    post_id: str,
    *,
    cursor: str | None = None,
    count: int = 20,
    language: str | None = None,
    timeout: float = 30.0,
) -> dict[str, Any]:
    params = {"count": str(count)}
    if language:
        params["lang"] = language
    if cursor:
        params["cursor"] = cursor
    return _fetch_api_page(f"/2/status/{post_id}/quotes", params, timeout)


def _iso_time(value: Any) -> str | None:
    if not value:
        return None
    if isinstance(value, int):
        return datetime.fromtimestamp(value, tz=UTC).isoformat()
    if isinstance(value, str):
        try:
            parsed = datetime.strptime(value, "%a %b %d %H:%M:%S %z %Y")
        except ValueError:
            return value
        return parsed.isoformat()
    return None


def _author(tweet: dict[str, Any]) -> dict[str, Any]:
    author = tweet.get("author") or {}
    return {
        "displayName": author.get("name"),
        "handle": author.get("screen_name"),
        "nativeId": str(author.get("id") or author.get("id_str") or "") or None,
        "url": (
            f"https://x.com/{author['screen_name']}"
            if author.get("screen_name")
            else None
        ),
    }


def _media_metadata(tweet: dict[str, Any]) -> list[dict[str, str]]:
    media = tweet.get("media")
    items: list[dict[str, Any]] = []
    if isinstance(media, list):
        items = [item for item in media if isinstance(item, dict)]
    elif isinstance(media, dict):
        preferred = media.get("all")
        if isinstance(preferred, list):
            items = [item for item in preferred if isinstance(item, dict)]
        else:
            for key in ("photos", "videos", "gifs"):
                values = media.get(key)
                if isinstance(values, list):
                    items.extend(item for item in values if isinstance(item, dict))

    results: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in items:
        alt_text = str(
            item.get("altText")
            or item.get("alt_text")
            or item.get("alt")
            or ""
        )[:1000]
        identity = str(
            item.get("id")
            or item.get("url")
            or item.get("media_url_https")
            or item.get("thumbnail_url")
            or ""
        )
        identity_hash = hashlib.sha256(identity.encode("utf-8")).hexdigest()
        key = f"{identity_hash}:{alt_text}"
        if key in seen:
            continue
        seen.add(key)
        results.append(
            {
                "type": str(item.get("type") or "unknown"),
                "altText": alt_text,
                "mediaIdentityHash": identity_hash,
            }
        )
    return results


def normalize_tweet(
    tweet: dict[str, Any],
    *,
    retrieved_at: str,
    run_id: str,
    seed_post_id: str,
) -> dict[str, Any]:
    post_id = str(tweet["id"])
    thread_root_id = str(
        tweet.get("conversation_id")
        or tweet.get("conversation_id_str")
        or seed_post_id
    )
    post_text = str(tweet.get("text") or "")
    media = _media_metadata(tweet)
    alt_text = "\n\n".join(
        item["altText"] for item in media if item["altText"]
    )
    text = post_text
    if alt_text:
        text = f"{post_text}\n\n[Image alt text]\n{alt_text}".strip()
    quoted = tweet.get("quote") if isinstance(tweet.get("quote"), dict) else None
    replying_to = tweet.get("replying_to")
    relations: list[dict[str, str]] = []

    if quoted and quoted.get("id"):
        relations.append({"type": "quotes", "targetSourceId": f"src:x:{quoted['id']}"})
    if replying_to:
        parent_id = str(
            tweet.get("in_reply_to_status_id")
            or tweet.get("in_reply_to_status_id_str")
            or (replying_to.get("status") if isinstance(replying_to, dict) else "")
            or ""
        )
        if parent_id:
            relations.append({"type": "replies_to", "targetSourceId": f"src:x:{parent_id}"})
    if thread_root_id != post_id:
        relations.append(
            {
                "type": "part_of_thread",
                "targetSourceId": f"src:x:{thread_root_id}",
            }
        )

    return {
        "schemaVersion": "0.1.0",
        "id": f"src:x:{post_id}",
        "sourceType": "social_post",
        "platform": "x",
        "nativeId": post_id,
        "url": tweet.get("url") or f"https://x.com/i/status/{post_id}",
        "author": _author(tweet),
        "publishedAt": _iso_time(tweet.get("created_timestamp") or tweet.get("created_at")),
        "retrievedAt": retrieved_at,
        "language": tweet.get("lang"),
        "text": text,
        "contentHash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "relations": relations,
        "engagement": {
            "likes": tweet.get("likes"),
            "reposts": tweet.get("retweets", tweet.get("reposts")),
            "replies": tweet.get("replies"),
            "views": tweet.get("views"),
        },
        "collection": {
            "collector": COLLECTOR_NAME,
            "collectorVersion": COLLECTOR_VERSION,
            "runId": run_id,
            "seedPostId": thread_root_id,
        },
        "metadata": {
            "possiblySensitive": tweet.get("possibly_sensitive"),
            "mediaCount": len(media),
            "media": media,
            "conversationId": thread_root_id,
        },
    }


def iter_tweet_graph(tweet: dict[str, Any]) -> Iterator[dict[str, Any]]:
    """Yield a post and embedded quoted posts once each."""

    seen: set[str] = set()
    stack = [tweet]
    while stack:
        current = stack.pop()
        post_id = str(current.get("id") or "")
        if not post_id or post_id in seen:
            continue
        seen.add(post_id)
        yield current
        quoted = current.get("quote")
        if isinstance(quoted, dict):
            stack.append(quoted)
