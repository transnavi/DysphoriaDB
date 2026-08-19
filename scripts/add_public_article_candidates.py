#!/usr/bin/env python3
"""Add selected public article excerpts to a private candidate ledger."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.public_article import (
    CollectionError,
    fetch_html,
    normalize_article,
    parse_article_url,
)
from collectors.private_storage import private_path_transaction
from scripts.add_public_post_candidates import (
    DISCOVERY_METHODS,
    read_ledger,
    retain_source_url,
    review_defaults_for_source,
    source_snapshot_changed,
    utc_now,
    write_json,
    write_ledger,
)
from scripts.validate_source_candidates import candidate_record_errors


REPORT_TYPES = (
    "unknown",
    "first_person",
    "first_person_plural",
    "first_person_summary",
    "autobiographical_second_person",
    "secondhand",
    "general_discourse",
    "hypothetical",
    "promotional",
    "context_only",
)


@private_path_transaction("output_path")
def add_article_candidates(
    urls: list[str],
    *,
    anchors: list[str],
    phenomenon: str,
    relation: str,
    claim_slug: str | None,
    method: str,
    query: str | None,
    language: str,
    context: str | None,
    report_type: str,
    identity_basis: str,
    output_path: Path,
    manifest_path: Path,
    retrieved_at: str | None = None,
) -> dict[str, Any]:
    retrieved_at = retrieved_at or utc_now()
    run_id = f"run:public-articles:{retrieved_at.replace(':', '-')}"
    candidates = read_ledger(output_path)
    captured_ids: list[str] = []
    failures: list[dict[str, str]] = []

    for url in urls:
        try:
            ref = parse_article_url(url)
            html, final_ref = fetch_html(ref)
            source = normalize_article(
                html,
                ref=final_ref,
                anchors=anchors,
                language=language,
                retrieved_at=retrieved_at,
                run_id=run_id,
            )
        except (CollectionError, ValueError) as error:
            failures.append({"url": url, "error": str(error)})
            continue

        candidate_id = f"candidate:{source['id']}"
        prior = candidates.get(candidate_id)
        proposed = {
            "relation": relation,
            "claimSlug": claim_slug,
            "label": phenomenon,
            "rationale": None,
        }
        review_defaults = {
            **review_defaults_for_source(source),
            "reportType": report_type,
            "identityBasis": identity_basis,
        }
        if prior:
            if source_snapshot_changed(prior, source):
                failures.append(
                    {
                        "url": url,
                        "error": (
                            "Public article excerpt changed; the reviewed snapshot "
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
                    "queryLanguage": language,
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
        "collector": "public_article_candidates",
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
    parser.add_argument("urls", nargs="+", help="Public Note, Ameblo, or LGBTER URLs")
    parser.add_argument("--anchor", action="append", required=True)
    parser.add_argument("--phenomenon", required=True)
    parser.add_argument(
        "--relation",
        choices=("supports_claim", "suggests_claim", "contextualizes_claim"),
        default="suggests_claim",
    )
    parser.add_argument("--claim-slug")
    parser.add_argument("--method", choices=DISCOVERY_METHODS, default="public_keyword_search")
    parser.add_argument("--query")
    parser.add_argument("--language", required=True)
    parser.add_argument("--context")
    parser.add_argument("--report-type", choices=REPORT_TYPES, default="unknown")
    parser.add_argument(
        "--identity-basis",
        choices=("unknown", "not_required", "same_post_explicit", "same_thread_explicit"),
        default="unknown",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(".private-research/discovered-candidates.jsonl"),
    )
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()

    retrieved_at = utc_now()
    manifest_path = args.manifest or Path(".private-research/runs") / (
        f"{retrieved_at.replace(':', '-')}-public-articles.json"
    )
    manifest = add_article_candidates(
        args.urls,
        anchors=args.anchor,
        phenomenon=args.phenomenon,
        relation=args.relation,
        claim_slug=args.claim_slug,
        method=args.method,
        query=args.query,
        language=args.language,
        context=args.context,
        report_type=args.report_type,
        identity_basis=args.identity_basis,
        output_path=args.output,
        manifest_path=manifest_path,
        retrieved_at=retrieved_at,
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return {"success": 0, "partial": 2, "failed": 1}[manifest["status"]]


if __name__ == "__main__":
    raise SystemExit(main())
