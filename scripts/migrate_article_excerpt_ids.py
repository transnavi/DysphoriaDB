#!/usr/bin/env python3
"""Migrate article candidates to anchor-specific source identities."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.private_storage import private_path_transaction, safe_path_label
from collectors.public_article import article_source_identity
from scripts.add_public_post_candidates import read_ledger, write_json, write_ledger
from scripts.apply_candidate_reviews import ReviewFailure
from scripts.validate_source_candidates import candidate_record_errors


@private_path_transaction("ledger_path")
def migrate_article_excerpt_ids(
    *,
    ledger_path: Path,
    schema_dir: Path,
    manifest_path: Path | None = None,
) -> dict[str, Any]:
    candidates = read_ledger(ledger_path)
    migrated: dict[str, dict[str, Any]] = {}
    aliases: dict[str, str] = {}

    for old_candidate_id, candidate in candidates.items():
        source = candidate["source"]
        collection = source.get("collection") or {}
        if collection.get("collector") != "public_article_excerpt":
            migrated[old_candidate_id] = candidate
            continue

        metadata = source.get("metadata") or {}
        anchors = [str(value) for value in metadata.get("excerptAnchors", [])]
        if not anchors:
            raise ReviewFailure(
                f"Article candidate has no excerpt anchors: {old_candidate_id}"
            )
        native_id, excerpt_key = article_source_identity(source["url"], anchors)
        source_id = f"src:web-article:{source['platform']}:{native_id}"
        new_candidate_id = f"candidate:{source_id}"
        if new_candidate_id in migrated:
            raise ReviewFailure(
                f"Article identity collision during migration: {new_candidate_id}"
            )

        source["nativeId"] = native_id
        source["id"] = source_id
        metadata["articleNativeId"] = native_id.split(":", 1)[0]
        metadata["excerptKey"] = excerpt_key
        candidate["candidateId"] = new_candidate_id
        if old_candidate_id != new_candidate_id:
            aliases[old_candidate_id] = new_candidate_id
        migrated[new_candidate_id] = candidate

    for candidate in migrated.values():
        review = candidate.get("review") or {}
        duplicate_of = review.get("duplicateOf")
        if duplicate_of in aliases:
            review["duplicateOf"] = aliases[duplicate_of]

    errors = candidate_record_errors(migrated, schema_dir)
    if errors:
        raise ReviewFailure(
            "Article ID migration failed schema validation: " + "; ".join(errors)
        )

    write_ledger(ledger_path, migrated)
    result = {
        "ledger": safe_path_label(ledger_path),
        "candidateCount": len(migrated),
        "migratedCount": len(aliases),
        "candidateIdAliases": dict(sorted(aliases.items())),
    }
    if manifest_path is not None:
        write_json(manifest_path, result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--schema-dir", type=Path, default=Path("schemas"))
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(".private-research/article-id-migration.json"),
    )
    args = parser.parse_args()
    try:
        result = migrate_article_excerpt_ids(
            ledger_path=args.ledger,
            schema_dir=args.schema_dir,
            manifest_path=args.manifest,
        )
    except (ReviewFailure, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
