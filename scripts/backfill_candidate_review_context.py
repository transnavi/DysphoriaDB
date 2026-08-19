#!/usr/bin/env python3
"""Fill source-derived review context in a private candidate ledger."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.add_public_post_candidates import (
    read_ledger,
    review_defaults_for_source,
    write_ledger,
)
from collectors.private_storage import private_path_transaction, safe_path_label
from scripts.apply_candidate_reviews import ReviewFailure
from scripts.validate_source_candidates import candidate_record_errors


@private_path_transaction("ledger_path")
def backfill_review_context(
    *,
    ledger_path: Path,
    schema_dir: Path,
) -> dict[str, Any]:
    candidates = read_ledger(ledger_path)
    changed_candidates = 0
    filled_fields = 0

    for candidate in candidates.values():
        review = candidate["review"]
        changed = False
        legacy_independence = str(review.get("independenceKey") or "")
        if ":unknown" in legacy_independence:
            review.pop("independenceKey", None)
            filled_fields += 1
            changed = True
        for key, value in review_defaults_for_source(candidate["source"]).items():
            if key not in review or review[key] is None:
                review[key] = value
                filled_fields += 1
                changed = True
        if changed:
            changed_candidates += 1

    errors = candidate_record_errors(candidates, schema_dir)
    if errors:
        raise ReviewFailure(
            "Review-context backfill failed schema validation: " + "; ".join(errors)
        )

    write_ledger(ledger_path, candidates)
    return {
        "ledger": safe_path_label(ledger_path),
        "candidateCount": len(candidates),
        "changedCandidateCount": changed_candidates,
        "filledFieldCount": filled_fields,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--schema-dir", type=Path, default=Path("schemas"))
    args = parser.parse_args()
    try:
        result = backfill_review_context(
            ledger_path=args.ledger,
            schema_dir=args.schema_dir,
        )
    except ReviewFailure as error:
        parser.error(str(error))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
