#!/usr/bin/env python3
"""Collect replies and commented reposts around an X post."""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.private_storage import write_private_text
from collectors.fxtwitter import (
    CollectionError,
    fetch_conversation_page,
    fetch_quotes_page,
    normalize_tweet,
    parse_status_url,
)


@dataclass
class PageCollection:
    records: list[dict[str, Any]]
    status: str
    terminal_reason: str
    pages_attempted: int
    pages_completed: int
    next_cursor: str | None
    failures: list[str]
    first_page: dict[str, Any] | None

    def summary(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "terminalReason": self.terminal_reason,
            "pagesAttempted": self.pages_attempted,
            "pagesCompleted": self.pages_completed,
            "recordCount": len(self.records),
            "nextCursor": self.next_cursor,
            "failures": self.failures,
        }


def write_json(path: Path, value: Any) -> None:
    write_private_text(
        path,
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def collect_pages(
    fetch: Callable[..., dict[str, Any]],
    post_id: str,
    key: str,
    max_pages: int,
    first_page: dict[str, Any] | None = None,
) -> PageCollection:
    records: dict[str, dict[str, Any]] = {}
    cursor: str | None = None
    seen_cursors: set[str] = set()
    pages_attempted = 0
    pages_completed = 0
    captured_first_page: dict[str, Any] | None = None
    for page_index in range(max_pages):
        pages_attempted += 1
        try:
            page = first_page if page_index == 0 and first_page is not None else fetch(post_id, cursor=cursor)
        except CollectionError as error:
            return PageCollection(
                records=list(records.values()),
                status="partial" if records else "failed",
                terminal_reason="request_failed",
                pages_attempted=pages_attempted,
                pages_completed=pages_completed,
                next_cursor=cursor,
                failures=[str(error)],
                first_page=captured_first_page,
            )
        pages_completed += 1
        if captured_first_page is None:
            captured_first_page = page
        for record in page.get(key, []):
            if record.get("id"):
                records[str(record["id"])] = record
        next_cursor = (page.get("cursor") or {}).get("bottom")
        if not next_cursor:
            return PageCollection(
                records=list(records.values()),
                status="complete",
                terminal_reason="provider_end",
                pages_attempted=pages_attempted,
                pages_completed=pages_completed,
                next_cursor=None,
                failures=[],
                first_page=captured_first_page,
            )
        if next_cursor in seen_cursors:
            return PageCollection(
                records=list(records.values()),
                status="partial",
                terminal_reason="cursor_cycle",
                pages_attempted=pages_attempted,
                pages_completed=pages_completed,
                next_cursor=next_cursor,
                failures=[],
                first_page=captured_first_page,
            )
        seen_cursors.add(next_cursor)
        cursor = next_cursor
    return PageCollection(
        records=list(records.values()),
        status="partial",
        terminal_reason="page_limit",
        pages_attempted=pages_attempted,
        pages_completed=pages_completed,
        next_cursor=cursor,
        failures=[],
        first_page=captured_first_page,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument(
        "--data-dir", type=Path, default=Path(".private-research/data")
    )
    parser.add_argument("--max-pages", type=int, default=30)
    parser.add_argument("--quote-language")
    args = parser.parse_args()
    if args.max_pages < 1:
        parser.error("--max-pages must be at least 1")

    ref = parse_status_url(args.url)
    replies_result = collect_pages(
        fetch_conversation_page, ref.post_id, "replies", args.max_pages
    )

    def fetch_quotes(post_id: str, *, cursor: str | None = None) -> dict[str, Any]:
        return fetch_quotes_page(
            post_id, cursor=cursor, language=args.quote_language
        )

    quotes_result = collect_pages(fetch_quotes, ref.post_id, "results", args.max_pages)
    replies = replies_result.records
    quotes = quotes_result.records
    first_page = replies_result.first_page or {}
    retrieved_at = datetime.now(tz=UTC).replace(microsecond=0).isoformat()
    run_suffix = uuid.uuid4().hex[:8]
    run_id = f"run:x-discussion:{ref.post_id}:{retrieved_at}:{run_suffix}"
    snapshot_key = (
        f"{retrieved_at.replace(':', '-')}-{run_suffix}-x-discussion-{ref.post_id}"
    )
    snapshot_root = args.data_dir / "snapshots" / snapshot_key
    stream_statuses = {replies_result.status, quotes_result.status}
    if stream_statuses == {"complete"}:
        collection_status = "complete"
    elif stream_statuses == {"failed"}:
        collection_status = "failed"
    else:
        collection_status = "partial"

    discussion = {
        "schemaVersion": "0.1.0",
        "runId": run_id,
        "snapshotKey": snapshot_key,
        "seed": args.url,
        "retrievedAt": retrieved_at,
        "status": collection_status,
        "providerStatus": first_page.get("status"),
        "streams": {
            "replies": replies_result.summary(),
            "quotes": quotes_result.summary(),
        },
        "thread": first_page.get("thread", []),
        "replies": replies,
        "quotes": quotes,
    }
    raw_relative_path = Path("raw") / "x-discussions" / f"{ref.post_id}.json"
    write_json(snapshot_root / raw_relative_path, discussion)
    write_json(args.data_dir / raw_relative_path, discussion)

    for tweet in [*replies, *quotes]:
        record = normalize_tweet(
            tweet,
            retrieved_at=retrieved_at,
            run_id=run_id,
            seed_post_id=ref.post_id,
        )
        normalized_relative_path = (
            Path("normalized") / "x" / f"{record['nativeId']}.json"
        )
        write_json(snapshot_root / normalized_relative_path, record)
        write_json(args.data_dir / normalized_relative_path, record)

    print(
        json.dumps(
            {
                "status": collection_status,
                "runId": run_id,
                "snapshotKey": snapshot_key,
                "replies": replies_result.summary(),
                "quotes": quotes_result.summary(),
            },
            indent=2,
        )
    )
    return {"complete": 0, "partial": 2, "failed": 1}[collection_status]


if __name__ == "__main__":
    raise SystemExit(main())
