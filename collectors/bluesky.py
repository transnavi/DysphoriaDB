"""Capture public Bluesky posts through the AT Protocol public API."""

from __future__ import annotations

import hashlib
import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any


COLLECTOR_NAME = "bluesky_public_api"
COLLECTOR_VERSION = "0.1.0"
API_ROOT = "https://public.api.bsky.app/xrpc"


class CollectionError(RuntimeError):
    """Raised when a Bluesky post cannot be retrieved or parsed."""


@dataclass(frozen=True)
class BlueskyRef:
    handle: str
    record_key: str


def parse_bluesky_url(url: str) -> BlueskyRef:
    parsed = urllib.parse.urlparse(url.strip())
    if parsed.hostname not in {"bsky.app", "www.bsky.app"}:
        raise ValueError(f"Unsupported Bluesky URL: {url}")
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) != 4 or parts[0] != "profile" or parts[2] != "post":
        raise ValueError(f"Unsupported Bluesky URL: {url}")
    return BlueskyRef(handle=parts[1], record_key=parts[3])


def _get_json(method: str, params: list[tuple[str, str]], timeout: float) -> dict[str, Any]:
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{API_ROOT}/{method}?{query}",
        headers={
            "Accept": "application/json",
            "User-Agent": "GenderExperienceIndex/0.1 source collector",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
        raise CollectionError(f"Bluesky request failed: {error}") from error


def fetch_post(ref: BlueskyRef, timeout: float = 20.0) -> dict[str, Any]:
    if ref.handle.startswith("did:"):
        did = ref.handle
    else:
        identity = _get_json(
            "com.atproto.identity.resolveHandle",
            [("handle", ref.handle)],
            timeout,
        )
        did = str(identity.get("did") or "")
    if not did:
        raise CollectionError(f"Bluesky could not resolve {ref.handle}")
    uri = f"at://{did}/app.bsky.feed.post/{ref.record_key}"
    payload = _get_json("app.bsky.feed.getPosts", [("uris", uri)], timeout)
    posts = payload.get("posts") or []
    if not posts or not isinstance(posts[0], dict):
        raise CollectionError(f"Bluesky returned no public post for {ref.record_key}")
    if str(posts[0].get("uri") or "") != uri:
        raise CollectionError(
            f"Bluesky returned a different post for {ref.record_key}"
        )
    return posts[0]


def _source_id(uri: str) -> str:
    parts = uri.removeprefix("at://").split("/")
    if len(parts) < 3:
        return f"src:bluesky:{uri}"
    return f"src:bluesky:{parts[0]}:{parts[-1]}"


def _quoted_uri(post: dict[str, Any], record: dict[str, Any]) -> str:
    containers = [post.get("embed"), record.get("embed")]
    for container in containers:
        if not isinstance(container, dict):
            continue
        quoted = container.get("record")
        if not isinstance(quoted, dict):
            continue
        nested = quoted.get("record") if isinstance(quoted.get("record"), dict) else {}
        uri = str(quoted.get("uri") or nested.get("uri") or "")
        if uri:
            return uri
    return ""


def _image_metadata(post: dict[str, Any], record: dict[str, Any]) -> list[dict[str, str]]:
    images: list[dict[str, Any]] = []
    for container in (post.get("embed"), record.get("embed")):
        if not isinstance(container, dict):
            continue
        direct = container.get("images")
        if isinstance(direct, list):
            images.extend(item for item in direct if isinstance(item, dict))
        media = container.get("media")
        if isinstance(media, dict) and isinstance(media.get("images"), list):
            images.extend(
                item for item in media["images"] if isinstance(item, dict)
            )

    results: list[dict[str, str]] = []
    seen: set[str] = set()
    for item in images:
        alt_text = str(item.get("alt") or "")[:1000]
        identity = str(
            item.get("fullsize")
            or item.get("thumb")
            or item.get("image")
            or ""
        )
        identity_hash = hashlib.sha256(identity.encode("utf-8")).hexdigest()
        key = f"{identity_hash}:{alt_text}"
        if key in seen:
            continue
        seen.add(key)
        results.append(
            {
                "altText": alt_text,
                "mediaIdentityHash": identity_hash,
            }
        )
    return results


def normalize_post(
    post: dict[str, Any],
    *,
    ref: BlueskyRef,
    retrieved_at: str,
    run_id: str,
) -> dict[str, Any]:
    uri = str(post.get("uri") or "")
    if not uri:
        raise CollectionError("A Bluesky response is missing its AT URI")
    record = post.get("record") if isinstance(post.get("record"), dict) else {}
    author = post.get("author") if isinstance(post.get("author"), dict) else {}
    post_text = str(record.get("text") or "")
    author_handle = str(author.get("handle") or ref.handle)
    relations: list[dict[str, str]] = []
    reply = record.get("reply") if isinstance(record.get("reply"), dict) else {}
    parent = reply.get("parent") if isinstance(reply.get("parent"), dict) else {}
    parent_uri = str(parent.get("uri") or "")
    if parent_uri:
        relations.append(
            {"type": "replies_to", "targetSourceId": _source_id(parent_uri)}
        )
    root = reply.get("root") if isinstance(reply.get("root"), dict) else {}
    root_uri = str(root.get("uri") or "")
    if root_uri and root_uri != uri:
        relations.append(
            {"type": "part_of_thread", "targetSourceId": _source_id(root_uri)}
        )
    quoted_uri = _quoted_uri(post, record)
    if quoted_uri:
        relations.append(
            {"type": "quotes", "targetSourceId": _source_id(quoted_uri)}
        )
    languages = record.get("langs") if isinstance(record.get("langs"), list) else []
    media = _image_metadata(post, record)
    alt_text = "\n\n".join(
        item["altText"] for item in media if item["altText"]
    )
    text = post_text
    if alt_text:
        text = f"{post_text}\n\n[Image alt text]\n{alt_text}".strip()

    return {
        "schemaVersion": "0.1.0",
        "id": _source_id(uri),
        "sourceType": "social_post",
        "platform": "bluesky",
        "nativeId": uri,
        "url": f"https://bsky.app/profile/{author_handle}/post/{ref.record_key}",
        "author": {
            "displayName": author.get("displayName"),
            "handle": author_handle,
            "nativeId": author.get("did"),
            "url": f"https://bsky.app/profile/{author_handle}",
        },
        "publishedAt": record.get("createdAt"),
        "retrievedAt": retrieved_at,
        "language": languages[0] if languages else None,
        "text": text,
        "contentHash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "relations": relations,
        "engagement": {
            "likes": post.get("likeCount"),
            "reposts": post.get("repostCount"),
            "replies": post.get("replyCount"),
            "quotes": post.get("quoteCount"),
        },
        "collection": {
            "collector": COLLECTOR_NAME,
            "collectorVersion": COLLECTOR_VERSION,
            "runId": run_id,
            "seedPostId": ref.record_key,
        },
        "metadata": {
            "cid": post.get("cid"),
            "rootUri": root_uri or uri,
            "media": media,
        },
    }
