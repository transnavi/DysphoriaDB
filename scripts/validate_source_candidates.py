#!/usr/bin/env python3
"""Validate a JSON Lines source-candidate ledger."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

from collectors.private_storage import safe_path_label


def build_validator(schema_dir: Path) -> Draft202012Validator:
    source_schema = json.loads(
        (schema_dir / "source.schema.json").read_text(encoding="utf-8")
    )
    candidate_schema = json.loads(
        (schema_dir / "source-candidate.schema.json").read_text(encoding="utf-8")
    )
    registry = Registry().with_resource(
        source_schema["$id"], Resource.from_contents(source_schema)
    )
    return Draft202012Validator(
        candidate_schema,
        registry=registry,
        format_checker=FormatChecker(),
    )


def semantic_errors(
    candidates: dict[str, dict[str, Any]],
    known_candidate_ids: set[str] | None = None,
) -> list[tuple[str, str]]:
    errors: list[tuple[str, str]] = []
    candidate_ids = known_candidate_ids or set(candidates)
    for ledger_id, candidate in candidates.items():
        source_id = str((candidate.get("source") or {}).get("id") or "")
        expected_id = f"candidate:{source_id}" if source_id else ""
        if expected_id and ledger_id != expected_id:
            errors.append(
                (
                    ledger_id,
                    f"candidateId must equal candidate:source.id ({expected_id})",
                )
            )

        review = candidate.get("review") or {}
        if review.get("status") == "duplicate":
            duplicate_of = str(review.get("duplicateOf") or "")
            if duplicate_of == ledger_id:
                errors.append((ledger_id, "duplicateOf cannot refer to itself"))
            elif duplicate_of and duplicate_of not in candidate_ids:
                errors.append(
                    (ledger_id, f"duplicateOf does not exist in this ledger: {duplicate_of}")
                )
    return errors


def candidate_record_errors(
    candidates: dict[str, dict[str, Any]],
    schema_dir: Path,
    known_candidate_ids: set[str] | None = None,
) -> list[str]:
    validator = build_validator(schema_dir)
    errors: list[str] = []
    for candidate_id, candidate in sorted(candidates.items()):
        for error in validator.iter_errors(candidate):
            location = ".".join(str(part) for part in error.absolute_path) or "record"
            errors.append(f"{candidate_id}, {location}: {error.message}")
    errors.extend(
        f"{candidate_id}, record: {message}"
        for candidate_id, message in semantic_errors(
            candidates,
            known_candidate_ids=known_candidate_ids,
        )
    )
    return errors


def review_diagnostics(
    candidates: dict[str, dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    content_hashes: dict[str, list[str]] = {}
    independence_keys: dict[str, list[str]] = {}
    for candidate_id, candidate in candidates.items():
        content_hash = str((candidate.get("source") or {}).get("contentHash") or "")
        if content_hash:
            content_hashes.setdefault(content_hash, []).append(candidate_id)
        independence_key = str(
            (candidate.get("review") or {}).get("independenceKey") or ""
        )
        if independence_key:
            independence_keys.setdefault(independence_key, []).append(candidate_id)

    return {
        "repeatedContentHashes": [
            {"contentHash": key, "candidateIds": sorted(values)}
            for key, values in sorted(content_hashes.items())
            if len(values) > 1
        ],
        "independenceClusters": [
            {"independenceKey": key, "candidateIds": sorted(values)}
            for key, values in sorted(independence_keys.items())
            if len(values) > 1
        ],
    }


def validate_ledger(
    path: Path,
    schema_dir: Path,
    known_candidate_ids: set[str] | None = None,
) -> dict[str, Any]:
    validator = build_validator(schema_dir)
    seen: set[str] = set()
    statuses: Counter[str] = Counter()
    errors: list[str] = []
    candidates: dict[str, dict[str, Any]] = {}
    candidate_lines: dict[str, int] = {}
    count = 0

    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        count += 1
        try:
            candidate = json.loads(line)
        except json.JSONDecodeError as error:
            errors.append(f"line {line_number}: invalid JSON: {error.msg}")
            continue
        candidate_id = candidate.get("candidateId")
        if candidate_id in seen:
            errors.append(f"line {line_number}: duplicate candidateId {candidate_id}")
        elif candidate_id:
            seen.add(candidate_id)
            candidates[str(candidate_id)] = candidate
            candidate_lines[str(candidate_id)] = line_number
        statuses[str((candidate.get("review") or {}).get("status") or "missing")] += 1
        for error in sorted(validator.iter_errors(candidate), key=lambda item: list(item.path)):
            location = ".".join(str(part) for part in error.absolute_path) or "record"
            errors.append(f"line {line_number}, {location}: {error.message}")

    for candidate_id, message in semantic_errors(
        candidates,
        known_candidate_ids=known_candidate_ids,
    ):
        errors.append(
            f"line {candidate_lines.get(candidate_id, '?')}, record: {message}"
        )

    return {
        "path": safe_path_label(path),
        "candidateCount": count,
        "reviewStatuses": dict(sorted(statuses.items())),
        "reviewDiagnostics": review_diagnostics(candidates),
        "valid": not errors,
        "errors": errors,
    }


def candidate_ids(path: Path) -> list[str]:
    ids: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        if value.get("candidateId"):
            ids.append(str(value["candidateId"]))
    return ids


def candidate_records(path: Path) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        candidate_id = str(value.get("candidateId") or "")
        if candidate_id:
            records.setdefault(candidate_id, value)
    return records


def validate_ledgers(paths: list[Path], schema_dir: Path) -> dict[str, Any]:
    all_candidate_ids = {
        candidate_id
        for path in paths
        for candidate_id in candidate_ids(path)
    }
    results = [
        validate_ledger(
            path,
            schema_dir,
            known_candidate_ids=all_candidate_ids,
        )
        for path in paths
    ]
    if len(results) == 1:
        return results[0]

    statuses: Counter[str] = Counter()
    combined_candidates: dict[str, dict[str, Any]] = {}
    for item in results:
        statuses.update(item["reviewStatuses"])
    for path in paths:
        for candidate_id, candidate in candidate_records(path).items():
            combined_candidates.setdefault(candidate_id, candidate)
    owners: dict[str, tuple[int, str]] = {}
    cross_duplicates: list[dict[str, str]] = []
    for index, path in enumerate(paths, 1):
        path_label = f"ledger[{index}]:{safe_path_label(path)}"
        for candidate_id in candidate_ids(path):
            owner = owners.get(candidate_id)
            if owner and owner[0] != index:
                cross_duplicates.append(
                    {
                        "candidateId": candidate_id,
                        "firstLedger": owner[1],
                        "secondLedger": path_label,
                    }
                )
            owners.setdefault(candidate_id, (index, path_label))
    return {
        "ledgerCount": len(results),
        "candidateCount": sum(item["candidateCount"] for item in results),
        "reviewStatuses": dict(sorted(statuses.items())),
        "reviewDiagnostics": review_diagnostics(combined_candidates),
        "valid": all(item["valid"] for item in results) and not cross_duplicates,
        "crossLedgerDuplicates": cross_duplicates,
        "ledgers": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "paths",
        type=Path,
        nargs="*",
    )
    parser.add_argument("--schema-dir", type=Path, default=Path("schemas"))
    args = parser.parse_args()
    paths = args.paths or [Path(".private-research/gdb-candidates.jsonl")]
    result = validate_ledgers(paths, args.schema_dir)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
