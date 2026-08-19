#!/usr/bin/env python3
"""Add explicitly selected public posts to a private candidate ledger."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.bluesky import (
    CollectionError as BlueskyCollectionError,
    fetch_post,
    normalize_post,
    parse_bluesky_url,
)
from collectors.fxtwitter import (
    CollectionError as XCollectionError,
    fetch_status,
    normalize_tweet,
    parse_status_url,
)
from collectors.private_storage import private_path_transaction, write_private_text
from collectors.reddit import (
    CollectionError as RedditCollectionError,
    fetch_item,
    normalize_item,
    parse_reddit_url,
)
from scripts.validate_source_candidates import candidate_record_errors


DISCOVERY_METHODS = (
    "direct_public_post",
    "public_keyword_search",
    "public_thread",
    "public_list",
    "user_submission",
)


def utc_now() -> str:
    return datetime.now(tz=UTC).isoformat(timespec="microseconds")


def read_ledger(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    records: dict[str, dict[str, Any]] = {}
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid JSON on line {line_number}: {error.msg}") from error
        candidate_id = str(record.get("candidateId") or "")
        if not candidate_id:
            raise ValueError(f"Missing candidateId on line {line_number}")
        if candidate_id in records:
            raise ValueError(
                f"Duplicate candidateId {candidate_id} on line {line_number}"
            )
        records[candidate_id] = record
    return records


def write_json(path: Path, value: Any) -> None:
    write_private_text(
        path,
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def write_ledger(path: Path, candidates: dict[str, dict[str, Any]]) -> None:
    text = "".join(
        json.dumps(candidate, ensure_ascii=False, sort_keys=True) + "\n"
        for _, candidate in sorted(candidates.items())
    )
    write_private_text(path, text)


def source_snapshot_changed(
    prior: dict[str, Any],
    source: dict[str, Any],
) -> bool:
    prior_hash = str((prior.get("source") or {}).get("contentHash") or "")
    current_hash = str(source.get("contentHash") or "")
    return bool(prior_hash and current_hash and prior_hash != current_hash)


def retain_source_url(discovery: dict[str, Any], url: str) -> None:
    source_urls = [str(value) for value in discovery.get("sourceUrls", [])]
    if url not in source_urls:
        source_urls.append(url)
    discovery["sourceUrls"] = source_urls


def review_defaults_for_source(source: dict[str, Any]) -> dict[str, Any]:
    platform = str(source.get("platform") or "unknown")
    author = source.get("author") if isinstance(source.get("author"), dict) else {}
    author_key = (
        author.get("nativeId")
        or author.get("handle")
        or author.get("url")
        or author.get("displayName")
        or "unknown"
    )
    metadata = source.get("metadata") if isinstance(source.get("metadata"), dict) else {}
    collection = (
        source.get("collection")
        if isinstance(source.get("collection"), dict)
        else {}
    )
    thread_source_id: str | None = None
    thread_key: str | None = None
    if platform == "reddit":
        thread_key = str(metadata.get("postId") or source["nativeId"])
        thread_source_id = f"src:reddit-thread:{thread_key}"
    elif platform == "bluesky":
        root_uri = str(metadata.get("rootUri") or source["nativeId"])
        parts = root_uri.removeprefix("at://").split("/")
        thread_key = f"{parts[0]}:{parts[-1]}" if len(parts) >= 3 else root_uri
        thread_source_id = f"src:bluesky-thread:{thread_key}"
    elif platform == "x":
        thread_key = str(collection.get("seedPostId") or source["nativeId"])
        thread_source_id = f"src:x-thread:{thread_key}"

    defaults: dict[str, Any] = {
        "status": "pending",
        "reportType": "unknown",
        "identityBasis": "unknown",
    }
    if thread_source_id and thread_key:
        defaults["threadSourceId"] = thread_source_id
        if author_key != "unknown":
            defaults["independenceKey"] = (
                f"{platform}-author:{author_key}:thread:{thread_key}"
            )
    elif (
        source.get("sourceType") in {"article", "blog_post"}
        and author_key != "unknown"
    ):
        defaults["independenceKey"] = f"article-author:{author_key}"
    return defaults


def fetch_source(url: str, *, retrieved_at: str, run_id: str) -> dict[str, Any]:
    try:
        ref = parse_status_url(url)
    except ValueError:
        try:
            reddit_ref = parse_reddit_url(url)
        except ValueError:
            bluesky_ref = parse_bluesky_url(url)
            post = fetch_post(bluesky_ref)
            return normalize_post(
                post,
                ref=bluesky_ref,
                retrieved_at=retrieved_at,
                run_id=run_id,
            )
        else:
            item = fetch_item(reddit_ref)
            return normalize_item(
                item,
                ref=reddit_ref,
                retrieved_at=retrieved_at,
                run_id=run_id,
            )
    payload = fetch_status(ref)
    return normalize_tweet(
        payload["tweet"],
        retrieved_at=retrieved_at,
        run_id=run_id,
        seed_post_id=ref.post_id,
    )


@private_path_transaction("output_path")
def add_candidates(
    urls: list[str],
    *,
    phenomenon: str,
    relation: str,
    claim_slug: str | None,
    method: str,
    query: str | None,
    query_language: str | None,
    context: str | None,
    output_path: Path,
    manifest_path: Path,
    retrieved_at: str | None = None,
) -> dict[str, Any]:
    retrieved_at = retrieved_at or utc_now()
    run_id = f"run:public-posts:{retrieved_at.replace(':', '-')}"
    candidates = read_ledger(output_path)
    captured_ids: list[str] = []
    failures: list[dict[str, str]] = []

    for url in urls:
        try:
            source = fetch_source(url, retrieved_at=retrieved_at, run_id=run_id)
        except (
            ValueError,
            KeyError,
            BlueskyCollectionError,
            XCollectionError,
            RedditCollectionError,
        ) as error:
            failures.append({"url": url, "error": str(error)})
            continue

        candidate_id = f"candidate:{source['id']}"
        proposed = {
            "relation": relation,
            "claimSlug": claim_slug,
            "label": phenomenon,
            "rationale": None,
        }
        prior = candidates.get(candidate_id)
        review_defaults = review_defaults_for_source(source)
        if prior:
            if source_snapshot_changed(prior, source):
                failures.append(
                    {
                        "url": url,
                        "error": (
                            "Public source content changed; the reviewed snapshot "
                            "was preserved"
                        ),
                    }
                )
                continue
            if proposed not in prior["proposedPhenomena"]:
                prior["proposedPhenomena"].append(proposed)
            prior["source"] = source
            retain_source_url(prior["discovery"], source["url"])
            prior["review"] = {**review_defaults, **prior["review"]}
            prior["availability"] = {"status": "public", "checkedAt": retrieved_at}
        else:
            candidates[candidate_id] = {
                "schemaVersion": "0.1.0",
                "candidateId": candidate_id,
                "source": source,
                "discovery": {
                    "method": method,
                    "sourceUrls": [source["url"]],
                    "discoveredAt": retrieved_at,
                    "context": context,
                    "query": query,
                    "queryLanguage": query_language,
                },
                "proposedPhenomena": [proposed],
                "review": review_defaults,
                "availability": {"status": "public", "checkedAt": retrieved_at},
                "publication": {"status": "unpublished", "publishedAt": None},
            }
        captured_ids.append(candidate_id)

    validation_errors = candidate_record_errors(candidates, Path("schemas"))
    if validation_errors:
        raise ValueError(
            "Candidate ledger failed validation: " + "; ".join(validation_errors)
        )
    write_ledger(output_path, candidates)
    status = "success" if not failures else ("partial" if captured_ids else "failed")
    manifest = {
        "schemaVersion": "0.1.0",
        "id": run_id,
        "collector": "public_post_candidates",
        "collectorVersion": "0.1.0",
        "startedAt": retrieved_at,
        "completedAt": retrieved_at,
        "status": status,
        "requestedCount": len(urls),
        "capturedCandidateIds": sorted(set(captured_ids)),
        "capturedCount": len(set(captured_ids)),
        "failures": failures,
    }
    write_json(manifest_path, manifest)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("urls", nargs="+", help="Public Bluesky, Reddit, or X post URLs")
    parser.add_argument("--phenomenon", required=True)
    parser.add_argument(
        "--relation",
        choices=("supports_claim", "suggests_claim", "contextualizes_claim"),
        default="suggests_claim",
    )
    parser.add_argument("--claim-slug")
    parser.add_argument("--method", choices=DISCOVERY_METHODS, default="direct_public_post")
    parser.add_argument("--query")
    parser.add_argument("--query-language")
    parser.add_argument("--context")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(".private-research/discovered-candidates.jsonl"),
    )
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()

    retrieved_at = utc_now()
    manifest_path = args.manifest or Path(".private-research/runs") / (
        f"{retrieved_at.replace(':', '-')}-public-posts.json"
    )
    manifest = add_candidates(
        args.urls,
        phenomenon=args.phenomenon,
        relation=args.relation,
        claim_slug=args.claim_slug,
        method=args.method,
        query=args.query,
        query_language=args.query_language,
        context=args.context,
        output_path=args.output,
        manifest_path=manifest_path,
        retrieved_at=retrieved_at,
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return {"success": 0, "partial": 2, "failed": 1}[manifest["status"]]


if __name__ == "__main__":
    raise SystemExit(main())
