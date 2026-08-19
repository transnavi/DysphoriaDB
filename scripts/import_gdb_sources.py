#!/usr/bin/env python3
"""Import public posts curated by the Gender Dysphoria Bible for review."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterable

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.private_storage import (
    private_path_transaction,
    safe_path_label,
    write_private_text,
)
from scripts.validate_source_candidates import candidate_record_errors


SCHEMA_VERSION = "0.1.0"
COLLECTOR_NAME = "gdb_twitter_backup"
COLLECTOR_VERSION = "0.1.0"
STATUS_ID_RE = re.compile(r"(?:status/)?(?P<id>\d{6,})")
BODY_TWITTER_RE = re.compile(
    r"https?://(?:www\.)?(?:twitter|x)\.com/(?:i/web/|[^/]+/)?status/(?P<id>\d+)",
    re.I,
)
DEFAULT_CHAPTERS = (
    "physical-dysphoria",
    "biochemical-dysphoria",
    "social-dysphoria",
    "societal-dysphoria",
    "sexual-dysphoria",
    "presentational-dysphoria",
    "managed-dysphoria",
    "euphoria",
    "impostor-syndrome",
)


class ImportFailure(RuntimeError):
    """Raised when a curated source set cannot be imported completely."""


def utc_now() -> str:
    return datetime.now(tz=UTC).isoformat(timespec="microseconds")


def extract_frontmatter_tweet_ids(text: str) -> list[str]:
    """Read tweet IDs from the ``tweets`` list in Markdown frontmatter."""

    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return []

    tweet_ids: list[str] = []
    inside_tweets = False
    for line in lines[1:]:
        stripped = line.strip()
        if stripped == "---":
            break
        if line == "tweets:":
            inside_tweets = True
            continue
        if inside_tweets and line and not line[0].isspace():
            inside_tweets = False
        if not inside_tweets or not stripped.startswith("-"):
            continue
        match = STATUS_ID_RE.search(stripped)
        if match:
            tweet_ids.append(match.group("id"))
    return tweet_ids


def extract_frontmatter_tweet_references(text: str) -> list[dict[str, Any]]:
    references: list[dict[str, Any]] = []
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return references

    inside_tweets = False
    for line_number, line in enumerate(lines[1:], 2):
        stripped = line.strip()
        if stripped == "---":
            break
        if line == "tweets:":
            inside_tweets = True
            continue
        if inside_tweets and line and not line[0].isspace():
            inside_tweets = False
        if not inside_tweets or not stripped.startswith("-"):
            continue
        match = STATUS_ID_RE.search(stripped)
        if match:
            references.append(
                {
                    "postId": match.group("id"),
                    "line": line_number,
                    "referenceType": "frontmatter",
                }
            )
    return references


def extract_body_tweet_references(text: str) -> list[dict[str, Any]]:
    lines = text.splitlines()
    body_start = 0
    if lines and lines[0].strip() == "---":
        for index, line in enumerate(lines[1:], 1):
            if line.strip() == "---":
                body_start = index + 1
                break
    references: list[dict[str, Any]] = []
    for line_number, line in enumerate(lines[body_start:], body_start + 1):
        for match in BODY_TWITTER_RE.finditer(line):
            references.append(
                {
                    "postId": match.group("id"),
                    "line": line_number,
                    "referenceType": "body_link",
                }
            )
    return references


def extract_body_tweet_ids(text: str) -> list[str]:
    return [
        reference["postId"]
        for reference in extract_body_tweet_references(text)
    ]


def _upstream_commit(chapter_dir: Path) -> str | None:
    gdb_root = chapter_dir.parents[1]
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=gdb_root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else None


def _thread_root_id(post_id: str, backup: dict[str, Any]) -> str:
    current = post_id
    seen: set[str] = set()
    while current not in seen:
        seen.add(current)
        tweet = backup.get(current)
        if not isinstance(tweet, dict):
            break
        parent = tweet.get("in_reply_to_status_id_str")
        if not isinstance(parent, str) or not parent:
            break
        current = parent
    return current


def _published_at(value: Any) -> str | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.strptime(value, "%a %b %d %H:%M:%S %z %Y").isoformat()
    except ValueError:
        return None


def normalize_legacy_tweet(
    tweet: dict[str, Any],
    *,
    retrieved_at: str,
    run_id: str,
    chapter_slugs: Iterable[str],
    gdb_references: Iterable[dict[str, Any]] = (),
    thread_root_id: str | None = None,
    upstream_commit: str | None = None,
    backup_content_hash: str | None = None,
) -> dict[str, Any]:
    post_id = str(tweet.get("id_str") or "")
    if not post_id:
        raise ImportFailure("A backup record is missing its exact string post ID")

    text = str(tweet.get("full_text") or tweet.get("text") or "")
    user = tweet.get("user") if isinstance(tweet.get("user"), dict) else {}
    handle = str(user.get("screen_name") or "") or None
    author_url = f"https://x.com/{handle}" if handle else None
    post_url = (
        f"https://x.com/{handle}/status/{post_id}"
        if handle
        else f"https://x.com/i/status/{post_id}"
    )

    relations: list[dict[str, str]] = []
    parent_id = tweet.get("in_reply_to_status_id_str")
    if parent_id:
        relations.append(
            {"type": "replies_to", "targetSourceId": f"src:x:{parent_id}"}
        )
    quoted = tweet.get("quoted_status")
    if isinstance(quoted, dict) and quoted.get("id_str"):
        quoted_id = str(quoted["id_str"])
        relations.append(
            {"type": "quotes", "targetSourceId": f"src:x:{quoted_id}"}
        )
    if thread_root_id and thread_root_id != post_id:
        relations.append(
            {
                "type": "part_of_thread",
                "targetSourceId": f"src:x-thread:{thread_root_id}",
            }
        )

    return {
        "schemaVersion": SCHEMA_VERSION,
        "id": f"src:x:{post_id}",
        "sourceType": "social_post",
        "platform": "x",
        "nativeId": post_id,
        "url": post_url,
        "author": {
            "displayName": user.get("name"),
            "handle": handle,
            "nativeId": str(user.get("id_str") or "") or None,
            "url": author_url,
        },
        "publishedAt": _published_at(tweet.get("created_at")),
        "retrievedAt": retrieved_at,
        "language": tweet.get("lang"),
        "text": text,
        "contentHash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "relations": relations,
        "engagement": {
            "likes": tweet.get("favorite_count"),
            "reposts": tweet.get("retweet_count"),
        },
        "collection": {
            "collector": COLLECTOR_NAME,
            "collectorVersion": COLLECTOR_VERSION,
            "runId": run_id,
            "seedPostId": thread_root_id or post_id,
        },
        "metadata": {
            "gdbChapters": sorted(set(chapter_slugs)),
            "gdbReferences": list(gdb_references),
            "upstreamCommit": upstream_commit,
            "retrievalBasis": "local_backup_import",
            "backupContentHash": backup_content_hash,
        },
    }


def _read_existing(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    records: dict[str, dict[str, Any]] = {}
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as error:
            raise ImportFailure(
                f"Invalid JSON on {safe_path_label(path)}:{line_number}: {error}"
            ) from error
        candidate_id = record.get("candidateId")
        if not candidate_id:
            raise ImportFailure(
                f"Missing candidateId on {safe_path_label(path)}:{line_number}"
            )
        if str(candidate_id) in records:
            raise ImportFailure(
                "Duplicate candidateId "
                f"{candidate_id} on {safe_path_label(path)}:{line_number}"
            )
        records[str(candidate_id)] = record
    return records


def _write_json(path: Path, value: Any) -> None:
    write_private_text(
        path,
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def _write_jsonl(path: Path, values: Iterable[dict[str, Any]]) -> None:
    text = "".join(
        json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n"
        for value in values
    )
    write_private_text(path, text)


@private_path_transaction("output_path")
def import_candidates(
    *,
    chapter_dir: Path,
    backup_path: Path,
    output_path: Path,
    manifest_path: Path,
    chapters: Iterable[str] = DEFAULT_CHAPTERS,
    imported_at: str | None = None,
    allow_missing: bool = False,
    allow_removals: bool = False,
) -> dict[str, Any]:
    imported_at = imported_at or utc_now()
    safe_time = imported_at.replace(":", "-")
    run_id = f"run:gdb-backup:{safe_time}"
    chapters_by_post: dict[str, set[str]] = defaultdict(set)
    references_by_post: dict[str, list[dict[str, Any]]] = defaultdict(list)
    body_tweet_ids: set[str] = set()
    body_references: list[dict[str, Any]] = []
    missing_chapters: list[str] = []

    for chapter_slug in chapters:
        chapter_path = chapter_dir / f"{chapter_slug}.md"
        if not chapter_path.exists():
            missing_chapters.append(chapter_slug)
            continue
        chapter_text = chapter_path.read_text(encoding="utf-8")
        for reference in extract_frontmatter_tweet_references(chapter_text):
            post_id = reference["postId"]
            chapters_by_post[post_id].add(chapter_slug)
            references_by_post[post_id].append(
                {"chapter": chapter_slug, **reference}
            )
        chapter_body_references = extract_body_tweet_references(chapter_text)
        body_references.extend(
            {"chapter": chapter_slug, **reference}
            for reference in chapter_body_references
        )
        body_tweet_ids.update(
            reference["postId"] for reference in chapter_body_references
        )

    backup_bytes = backup_path.read_bytes()
    backup_content_hash = hashlib.sha256(backup_bytes).hexdigest()
    backup = json.loads(backup_bytes.decode("utf-8"))
    if not isinstance(backup, dict):
        raise ImportFailure("The Twitter backup must be a JSON object keyed by post ID")

    missing_posts = sorted(set(chapters_by_post) - set(backup))
    if (missing_chapters or missing_posts) and not allow_missing:
        parts = []
        if missing_chapters:
            parts.append(f"missing chapters: {', '.join(missing_chapters)}")
        if missing_posts:
            parts.append(f"missing backup posts: {', '.join(missing_posts)}")
        raise ImportFailure("; ".join(parts))

    existing = _read_existing(output_path)
    commit = _upstream_commit(chapter_dir)
    candidates: list[dict[str, Any]] = []
    for post_id, chapter_slugs in sorted(chapters_by_post.items()):
        tweet = backup.get(post_id)
        if not isinstance(tweet, dict):
            continue
        source = normalize_legacy_tweet(
            tweet,
            retrieved_at=imported_at,
            run_id=run_id,
            chapter_slugs=chapter_slugs,
            gdb_references=references_by_post[post_id],
            thread_root_id=_thread_root_id(post_id, backup),
            upstream_commit=commit,
            backup_content_hash=backup_content_hash,
        )
        candidate_id = f"candidate:{source['id']}"
        prior = existing.get(candidate_id, {})
        prior_hash = str((prior.get("source") or {}).get("contentHash") or "")
        if prior_hash and prior_hash != source["contentHash"]:
            raise ImportFailure(
                f"Archived source changed for {candidate_id}; review the backup update"
            )
        discovery = prior.get("discovery") or {
            "method": "curated_public_source",
            "sourceUrls": [
                f"https://genderdysphoria.fyi/en/{slug}"
                for slug in sorted(chapter_slugs)
            ],
            "discoveredAt": imported_at,
            "context": "Cited in Gender Dysphoria Bible chapter frontmatter.",
        }
        author = source.get("author") or {}
        author_key = author.get("nativeId") or author.get("handle") or "unknown"
        thread_root_id = source["collection"]["seedPostId"]
        review_defaults = {
            "status": "pending",
            "reportType": "unknown",
            "identityBasis": "unknown",
            "threadSourceId": f"src:x-thread:{thread_root_id}",
            "independenceKey": (
                f"x-author:{author_key}:thread:{thread_root_id}"
            ),
        }
        review = {**review_defaults, **prior.get("review", {})}
        candidates.append(
            {
                "schemaVersion": SCHEMA_VERSION,
                "candidateId": candidate_id,
                "source": source,
                "discovery": discovery,
                "proposedPhenomena": prior.get("proposedPhenomena", []),
                "review": review,
                "availability": prior.get(
                    "availability", {"status": "unchecked", "checkedAt": None}
                ),
                "publication": prior.get(
                    "publication", {"status": "unpublished", "publishedAt": None}
                ),
            }
        )

    candidate_ids = {candidate["candidateId"] for candidate in candidates}
    removed_candidate_ids = sorted(set(existing) - candidate_ids)
    if removed_candidate_ids and not allow_removals:
        raise ImportFailure(
            "Import would remove existing candidates; review the input change or "
            "use --allow-removals: " + ", ".join(removed_candidate_ids)
        )

    candidate_map = {candidate["candidateId"]: candidate for candidate in candidates}
    validation_errors = candidate_record_errors(candidate_map, Path("schemas"))
    if validation_errors:
        raise ImportFailure(
            "Imported candidates failed validation: " + "; ".join(validation_errors)
        )

    _write_jsonl(output_path, candidates)
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "id": run_id,
        "collector": COLLECTOR_NAME,
        "collectorVersion": COLLECTOR_VERSION,
        "startedAt": imported_at,
        "completedAt": imported_at,
        "status": "partial" if missing_chapters or missing_posts else "success",
        "chapters": list(chapters),
        "candidateCount": len(candidates),
        "upstreamCommit": commit,
        "backupContentHash": backup_content_hash,
        "missingChapters": missing_chapters,
        "missingPostIds": missing_posts,
        "bodyOnlyTweetIds": sorted(body_tweet_ids - set(chapters_by_post)),
        "bodyOnlyTweetReferences": sorted(
            (
                reference
                for reference in body_references
                if reference["postId"] not in chapters_by_post
            ),
            key=lambda item: (item["chapter"], item["line"], item["postId"]),
        ),
        "missingBodyOnlyTweetIds": sorted(body_tweet_ids - set(backup)),
        "removedCandidateIds": removed_candidate_ids,
        "output": output_path.name,
    }
    _write_json(manifest_path, manifest)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--gdb-root", type=Path, default=Path("../GenderDysphoria.fyi")
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(".private-research/gdb-candidates.jsonl"),
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(".private-research/gdb-import-manifest.json"),
    )
    parser.add_argument("--allow-missing", action="store_true")
    parser.add_argument("--allow-removals", action="store_true")
    args = parser.parse_args()

    manifest = import_candidates(
        chapter_dir=args.gdb_root / "public" / "en",
        backup_path=args.gdb_root / "twitter-backup.json",
        output_path=args.output,
        manifest_path=args.manifest,
        allow_missing=args.allow_missing,
        allow_removals=args.allow_removals,
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0 if manifest["status"] == "success" else 2


if __name__ == "__main__":
    raise SystemExit(main())
