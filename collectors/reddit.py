"""Capture public Reddit submissions and comments with stable permalinks."""

from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from bs4 import BeautifulSoup


COLLECTOR_NAME = "reddit_public_post"
COLLECTOR_VERSION = "0.1.0"
API_ROOT = "https://www.reddit.com"


class CollectionError(RuntimeError):
    """Raised when a Reddit source cannot be retrieved or parsed."""


@dataclass(frozen=True)
class RedditRef:
    subreddit: str
    post_id: str
    comment_id: str | None = None

    @property
    def fullname(self) -> str:
        prefix = "t1" if self.comment_id else "t3"
        return f"{prefix}_{self.comment_id or self.post_id}"


def parse_reddit_url(url: str) -> RedditRef:
    parsed = urllib.parse.urlparse(url.strip())
    hostname = (parsed.hostname or "").lower()
    if hostname != "reddit.com" and not hostname.endswith(".reddit.com"):
        raise ValueError(f"Unsupported Reddit URL: {url}")
    parts = [part for part in parsed.path.split("/") if part]
    try:
        subreddit_index = parts.index("r")
        comments_index = parts.index("comments")
        subreddit = parts[subreddit_index + 1]
        post_id = parts[comments_index + 1]
    except (ValueError, IndexError) as error:
        raise ValueError(f"Unsupported Reddit URL: {url}") from error

    tail = parts[comments_index + 2 :]
    comment_id: str | None = None
    if len(tail) >= 2:
        comment_id = tail[1]
    return RedditRef(subreddit=subreddit, post_id=post_id, comment_id=comment_id)


def canonical_url(ref: RedditRef) -> str:
    root = f"{API_ROOT}/r/{ref.subreddit}/comments/{ref.post_id}"
    if ref.comment_id:
        return f"{root}/comment/{ref.comment_id}/"
    return f"{root}/"


def normalize_permalink(value: str) -> str:
    url = urllib.parse.urljoin(API_ROOT, value)
    parsed = urllib.parse.urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if hostname != "reddit.com" and not hostname.endswith(".reddit.com"):
        raise CollectionError("Reddit returned a permalink outside reddit.com")
    encoded_path = urllib.parse.quote(
        urllib.parse.unquote(parsed.path), safe="/"
    )
    return urllib.parse.urlunparse(
        parsed._replace(
            scheme="https",
            netloc="www.reddit.com",
            path=encoded_path,
            params="",
            query="",
            fragment="",
        )
    )


def fetch_item(ref: RedditRef, timeout: float = 20.0) -> dict[str, Any]:
    query = urllib.parse.urlencode({"id": ref.fullname, "raw_json": "1"})
    request = urllib.request.Request(
        f"{API_ROOT}/api/info.json?{query}",
        headers={
            "Accept": "application/json",
            "User-Agent": "GenderExperienceIndex/0.1 source collector",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == 403:
            return fetch_html_item(ref, timeout=timeout)
        raise CollectionError(f"Reddit request failed for {ref.fullname}: {error}") from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise CollectionError(f"Reddit request failed for {ref.fullname}: {error}") from error
    children = ((payload.get("data") or {}).get("children") or [])
    if not children or not isinstance(children[0].get("data"), dict):
        raise CollectionError(f"Reddit returned no public item for {ref.fullname}")
    item = dict(children[0])
    if str(item["data"].get("name") or "") != ref.fullname:
        raise CollectionError(
            f"Reddit returned a different public item for {ref.fullname}"
        )
    item["retrievalMethod"] = "reddit_api_info"
    return item


def parse_html_item(html: str, ref: RedditRef) -> dict[str, Any]:
    document = BeautifulSoup(html, "html.parser")
    thing = document.find("div", attrs={"data-fullname": ref.fullname})
    if thing is None:
        raise CollectionError(f"Reddit HTML contains no public item for {ref.fullname}")
    entry = thing.find("div", class_="entry", recursive=False)
    if entry is None:
        raise CollectionError(f"Reddit HTML has no readable entry for {ref.fullname}")

    body_element = entry.select_one(".usertext-body .md")
    body = body_element.get_text("\n", strip=True) if body_element else ""
    title_element = entry.select_one("p.title a.title")
    title = title_element.get_text(" ", strip=True) if title_element else ""
    time_element = entry.find("time", attrs={"datetime": True})
    created_utc: float | None = None
    if time_element:
        try:
            created_utc = datetime.fromisoformat(time_element["datetime"]).timestamp()
        except (TypeError, ValueError):
            created_utc = None

    author = str(thing.get("data-author") or "")
    permalink = str(thing.get("data-permalink") or canonical_url(ref))
    score = thing.get("data-score")
    comments = thing.get("data-comments-count")
    return {
        "kind": ref.fullname.split("_", 1)[0],
        "retrievalMethod": "old_reddit_html",
        "data": {
            "name": ref.fullname,
            "body": body,
            "selftext": body,
            "title": title,
            "author": author or "[deleted]",
            "parent_id": thing.get("data-parent-fullname"),
            "created_utc": created_utc,
            "permalink": permalink,
            "subreddit": thing.get("data-subreddit") or ref.subreddit,
            "score": int(score) if str(score).isdigit() else None,
            "num_comments": int(comments) if str(comments).isdigit() else None,
        },
    }


def fetch_html_item(ref: RedditRef, timeout: float = 20.0) -> dict[str, Any]:
    parsed = urllib.parse.urlparse(canonical_url(ref))
    url = urllib.parse.urlunparse(parsed._replace(netloc="old.reddit.com"))
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/html",
            "User-Agent": "Mozilla/5.0 (compatible; GenderExperienceIndex/0.1)",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            html = response.read().decode("utf-8", errors="replace")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        raise CollectionError(f"Reddit HTML request failed for {ref.fullname}: {error}") from error
    return parse_html_item(html, ref)


def _published_at(value: Any) -> str | None:
    if not isinstance(value, (float, int)):
        return None
    return datetime.fromtimestamp(value, tz=UTC).isoformat()


def normalize_item(
    item: dict[str, Any],
    *,
    ref: RedditRef,
    retrieved_at: str,
    run_id: str,
) -> dict[str, Any]:
    kind = str(item.get("kind") or "")
    data = item.get("data") if isinstance(item.get("data"), dict) else {}
    native_id = str(data.get("name") or ref.fullname)
    author = str(data.get("author") or "")
    if author == "[deleted]":
        author = ""
    if kind == "t1":
        text = str(data.get("body") or "")
    else:
        title = str(data.get("title") or "")
        body = str(data.get("selftext") or "")
        text = f"{title}\n\n{body}".strip()

    permalink = data.get("permalink")
    url = normalize_permalink(str(permalink)) if permalink else canonical_url(ref)
    relations: list[dict[str, str]] = []
    parent = str(data.get("parent_id") or "")
    if parent.startswith(("t1_", "t3_")):
        relations.append(
            {"type": "replies_to", "targetSourceId": f"src:reddit:{parent}"}
        )

    return {
        "schemaVersion": "0.1.0",
        "id": f"src:reddit:{native_id}",
        "sourceType": "social_post",
        "platform": "reddit",
        "nativeId": native_id,
        "url": url,
        "author": {
            "displayName": f"u/{author}" if author else None,
            "handle": author or None,
            "nativeId": None,
            "url": f"https://www.reddit.com/user/{author}/" if author else None,
        },
        "publishedAt": _published_at(data.get("created_utc")),
        "retrievedAt": retrieved_at,
        "language": None,
        "text": text,
        "contentHash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "relations": relations,
        "engagement": {
            "score": data.get("score"),
            "comments": data.get("num_comments") if kind == "t3" else None,
        },
        "collection": {
            "collector": COLLECTOR_NAME,
            "collectorVersion": COLLECTOR_VERSION,
            "runId": run_id,
            "seedPostId": ref.post_id,
        },
        "metadata": {
            "subreddit": data.get("subreddit") or ref.subreddit,
            "redditKind": kind or native_id.split("_", 1)[0],
            "postId": ref.post_id,
            "retrievalMethod": item.get("retrievalMethod"),
        },
    }
