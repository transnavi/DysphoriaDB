#!/usr/bin/env python3
"""Collect replies and commented reposts around an X post."""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable

from collectors.fxtwitter import (
    CollectionError,
    fetch_conversation_page,
    fetch_quotes_page,
    normalize_tweet,
    parse_status_url,
)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def collect_pages(
    fetch: Callable[..., dict[str, Any]],
    post_id: str,
    key: str,
    max_pages: int,
    first_page: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    cursor: str | None = None
    seen_cursors: set[str] = set()
    for page_index in range(max_pages):
        try:
            page = first_page if page_index == 0 and first_page is not None else fetch(post_id, cursor=cursor)
        except CollectionError:
            if records:
                break
            raise
        for record in page.get(key, []):
            if record.get("id"):
                records[str(record["id"])] = record
        next_cursor = (page.get("cursor") or {}).get("bottom")
        if not next_cursor or next_cursor in seen_cursors:
            break
        seen_cursors.add(next_cursor)
        cursor = next_cursor
    return list(records.values())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--max-pages", type=int, default=30)
    args = parser.parse_args()

    ref = parse_status_url(args.url)
    first_page = fetch_conversation_page(ref.post_id)
    replies = collect_pages(fetch_conversation_page, ref.post_id, "replies", args.max_pages, first_page)
    quotes = collect_pages(fetch_quotes_page, ref.post_id, "results", args.max_pages)
    retrieved_at = datetime.now(tz=UTC).replace(microsecond=0).isoformat()
    run_id = f"run:x-discussion:{ref.post_id}:{retrieved_at}"

    discussion = {
        "schemaVersion": "0.1.0",
        "seed": args.url,
        "retrievedAt": retrieved_at,
        "status": first_page.get("status"),
        "thread": first_page.get("thread", []),
        "replies": replies,
        "quotes": quotes,
    }
    write_json(args.data_dir / "raw" / "x-discussions" / f"{ref.post_id}.json", discussion)

    for tweet in [*replies, *quotes]:
        record = normalize_tweet(
            tweet,
            retrieved_at=retrieved_at,
            run_id=run_id,
            seed_post_id=ref.post_id,
        )
        write_json(args.data_dir / "normalized" / "x" / f"{record['nativeId']}.json", record)

    print(json.dumps({"replies": len(replies), "quotes": len(quotes)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
