#!/usr/bin/env python3
"""Apply private editorial decisions to a source-candidate ledger."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.add_public_post_candidates import read_ledger, write_ledger
from collectors.private_storage import private_path_transaction, safe_path_label
from scripts.validate_source_candidates import candidate_record_errors


class ReviewFailure(RuntimeError):
    """Raised when a review batch cannot be applied safely."""


def read_decisions(path: Path) -> list[dict[str, Any]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, list):
        raise ReviewFailure("The review decision file must contain a JSON array")
    return value


@private_path_transaction("ledger_path")
def apply_reviews(
    *,
    ledger_path: Path,
    decisions_path: Path,
    schema_dir: Path,
) -> dict[str, Any]:
    candidates = read_ledger(ledger_path)
    decisions = read_decisions(decisions_path)
    seen: set[str] = set()
    unknown: list[str] = []
    for decision in decisions:
        candidate_id = str(decision.get("candidateId") or "")
        if not candidate_id and decision.get("sourceUrl"):
            source_url = str(decision["sourceUrl"])
            matches = [
                value["candidateId"]
                for value in candidates.values()
                if value["source"].get("url") == source_url
            ]
            if len(matches) != 1:
                raise ReviewFailure(
                    f"sourceUrl must identify exactly one candidate: {source_url}"
                )
            candidate_id = matches[0]
        if not candidate_id:
            raise ReviewFailure("Every decision needs a candidateId or sourceUrl")
        if candidate_id in seen:
            raise ReviewFailure(f"Duplicate review decision for {candidate_id}")
        seen.add(candidate_id)
        candidate = candidates.get(candidate_id)
        if candidate is None:
            unknown.append(candidate_id)
            continue

        for proposed in decision.get("proposedPhenomena", []):
            if proposed not in candidate["proposedPhenomena"]:
                candidate["proposedPhenomena"].append(proposed)
        if decision.get("replaceProposedPhenomena"):
            candidate["proposedPhenomena"] = decision.get(
                "proposedPhenomena", []
            )
        candidate["review"] = {
            **candidate["review"],
            **decision.get("review", {}),
        }
        if "availability" in decision:
            candidate["availability"] = {
                **candidate["availability"],
                **decision["availability"],
            }

    if unknown:
        raise ReviewFailure(f"Unknown candidate IDs: {', '.join(sorted(unknown))}")

    errors = candidate_record_errors(candidates, schema_dir)
    if errors:
        raise ReviewFailure("Review batch failed schema validation: " + "; ".join(errors))

    write_ledger(ledger_path, candidates)
    statuses = Counter(candidate["review"]["status"] for candidate in candidates.values())
    return {
        "ledger": safe_path_label(ledger_path),
        "decisionCount": len(decisions),
        "candidateCount": len(candidates),
        "reviewStatuses": dict(sorted(statuses.items())),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--decisions", type=Path, required=True)
    parser.add_argument("--schema-dir", type=Path, default=Path("schemas"))
    args = parser.parse_args()
    try:
        result = apply_reviews(
            ledger_path=args.ledger,
            decisions_path=args.decisions,
            schema_dir=args.schema_dir,
        )
    except ReviewFailure as error:
        parser.error(str(error))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
