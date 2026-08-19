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

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.private_storage import write_private_text
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
    write_private_text(
        path,
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def collect(seed_urls: list[str], data_dir: Path) -> dict[str, Any]:
    started_at = utc_now()
    run_suffix = uuid.uuid4().hex[:8]
    run_id = f"run:x:{started_at}:{run_suffix}"
    snapshot_key = f"{started_at.replace(':', '-')}-{run_suffix}-x"
    snapshot_root = data_dir / "snapshots" / snapshot_key
    captured: dict[str, dict[str, Any]] = {}
    failures: list[dict[str, str]] = []

    for seed_url in seed_urls:
        try:
            ref = parse_status_url(seed_url)
            payload = fetch_status(ref)
            raw_path = data_dir / "raw" / "x" / f"{ref.post_id}.json"
            write_json(
                snapshot_root / "raw" / "x" / f"{ref.post_id}.json",
                payload,
            )
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
        write_json(
            snapshot_root / "normalized" / "x" / f"{record['nativeId']}.json",
            record,
        )
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
        "snapshotKey": snapshot_key,
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
    parser.add_argument(
        "--seeds",
        type=Path,
        default=Path(".private-research/seeds/x.txt"),
    )
    parser.add_argument(
        "--data-dir", type=Path, default=Path(".private-research/data")
    )
    args = parser.parse_args()

    seeds = args.urls or read_seeds(args.seeds)
    if not seeds:
        parser.error("no seed URLs supplied")
    manifest = collect(seeds, args.data_dir)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return {"success": 0, "partial": 2, "failed": 1}[manifest["status"]]


if __name__ == "__main__":
    sys.exit(main())
