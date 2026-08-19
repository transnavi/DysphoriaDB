#!/usr/bin/env python3
"""Collect X seed posts and embedded quote relationships."""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from collectors.fxtwitter import (
    COLLECTOR_NAME,
    COLLECTOR_VERSION,
    CollectionError,
    fetch_status,
    iter_tweet_graph,
    normalize_tweet,
    parse_status_url,
)


def utc_now() -> str:
    return datetime.now(tz=UTC).replace(microsecond=0).isoformat()


def read_seeds(path: Path) -> list[str]:
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def collect(seed_urls: list[str], data_dir: Path) -> dict[str, Any]:
    started_at = utc_now()
    run_id = f"run:x:{started_at}:{uuid.uuid4().hex[:8]}"
    captured: dict[str, dict[str, Any]] = {}
    failures: list[dict[str, str]] = []

    for seed_url in seed_urls:
        try:
            ref = parse_status_url(seed_url)
            payload = fetch_status(ref)
            raw_path = data_dir / "raw" / "x" / f"{ref.post_id}.json"
            write_json(raw_path, payload)

            retrieved_at = utc_now()
            for tweet in iter_tweet_graph(payload["tweet"]):
                record = normalize_tweet(
                    tweet,
                    retrieved_at=retrieved_at,
                    run_id=run_id,
                    seed_post_id=ref.post_id,
                )
                captured[record["id"]] = record
        except (CollectionError, ValueError, KeyError) as error:
            failures.append({"seed": seed_url, "error": str(error)})

    for record in captured.values():
        path = data_dir / "normalized" / "x" / f"{record['nativeId']}.json"
        write_json(path, record)

    completed_at = utc_now()
    manifest = {
        "schemaVersion": "0.1.0",
        "id": run_id,
        "collector": COLLECTOR_NAME,
        "collectorVersion": COLLECTOR_VERSION,
        "startedAt": started_at,
        "completedAt": completed_at,
        "status": "success" if not failures else ("partial" if captured else "failed"),
        "seeds": seed_urls,
        "capturedSourceIds": sorted(captured),
        "capturedCount": len(captured),
        "failures": failures,
    }
    safe_timestamp = started_at.replace(":", "-")
    write_json(data_dir / "runs" / f"{safe_timestamp}-x.json", manifest)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("urls", nargs="*", help="X status URLs")
    parser.add_argument("--seeds", type=Path, default=Path("seeds/x.txt"))
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    args = parser.parse_args()

    seeds = args.urls or read_seeds(args.seeds)
    if not seeds:
        parser.error("no seed URLs supplied")
    manifest = collect(seeds, args.data_dir)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0 if manifest["status"] != "failed" else 1


if __name__ == "__main__":
    sys.exit(main())
