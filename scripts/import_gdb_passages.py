#!/usr/bin/env python3
"""Import selected Gender Dysphoria Bible passages into a private review ledger."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterable

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from collectors.private_storage import (
    private_path_transaction,
    safe_path_label,
    write_private_text,
)
from scripts.validate_source_candidates import candidate_record_errors


SCHEMA_VERSION = "0.1.0"
COLLECTOR_NAME = "gdb_prose_passage"
COLLECTOR_VERSION = "0.1.0"
HEADING_RE = re.compile(r"^(?P<level>#{1,6})\s+(?P<title>.+?)\s*$")
DATE_RE = re.compile(r'^date:\s*["\']?(?P<date>[^"\']+)["\']?\s*$')


class ImportFailure(RuntimeError):
    """Raised when a requested passage cannot be imported exactly."""


def utc_now() -> str:
    return datetime.now(tz=UTC).isoformat(timespec="microseconds")


def slugify_heading(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def chapter_date(lines: list[str]) -> str | None:
    if not lines or lines[0].strip() != "---":
        return None
    for line in lines[1:]:
        if line.strip() == "---":
            break
        match = DATE_RE.match(line.strip())
        if match:
            return match.group("date")
    return None


def section_at(lines: list[str], line_number: int) -> tuple[str | None, str | None]:
    heading: str | None = None
    for line in lines[:line_number]:
        match = HEADING_RE.match(line)
        if match:
            heading = match.group("title")
    return heading, slugify_heading(heading) if heading else None


def upstream_commit(gdb_root: Path) -> str | None:
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=gdb_root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else None


def read_specs(path: Path) -> list[dict[str, Any]]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, list):
        raise ImportFailure("The passage specification must be a JSON array")
    return value


def read_existing(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    records: dict[str, dict[str, Any]] = {}
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as error:
            raise ImportFailure(
                f"Invalid JSON on {safe_path_label(path)}:{line_number}: {error.msg}"
            ) from error
        candidate_id = str(record.get("candidateId") or "")
        if not candidate_id:
            raise ImportFailure(
                f"Missing candidateId on {safe_path_label(path)}:{line_number}"
            )
        if candidate_id in records:
            raise ImportFailure(
                "Duplicate candidateId "
                f"{candidate_id} on {safe_path_label(path)}:{line_number}"
            )
        records[candidate_id] = record
    return records


def passage_candidate(
    *,
    spec: dict[str, Any],
    chapter_dir: Path,
    imported_at: str,
    run_id: str,
    commit: str | None,
    prior: dict[str, Any] | None,
) -> dict[str, Any]:
    chapter = str(spec.get("chapter") or "")
    start = spec.get("lineStart")
    end = spec.get("lineEnd")
    if not chapter or not isinstance(start, int) or not isinstance(end, int):
        raise ImportFailure("Each passage needs chapter, lineStart, and lineEnd")
    chapter_path = chapter_dir / f"{chapter}.md"
    if not chapter_path.exists():
        raise ImportFailure(f"Missing GDB chapter: {chapter}")
    lines = chapter_path.read_text(encoding="utf-8").splitlines()
    if start < 1 or end < start or end > len(lines):
        raise ImportFailure(
            f"Invalid line range for {chapter}: {start}-{end} of {len(lines)}"
        )

    text = "\n".join(lines[start - 1 : end]).strip()
    if not text:
        raise ImportFailure(f"Empty passage for {chapter}:{start}-{end}")
    heading, anchor = section_at(lines, start)
    source_id = f"src:gdb-passage:{chapter}:L{start}-L{end}"
    candidate_id = f"candidate:{source_id}"
    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    prior_hash = ((prior or {}).get("source") or {}).get("contentHash")
    if prior_hash and prior_hash != content_hash:
        raise ImportFailure(
            f"GDB passage changed at {chapter}:{start}-{end}; review the line range"
        )
    url = f"https://genderdysphoria.fyi/en/{chapter}"
    if anchor:
        url = f"{url}#{anchor}"

    prior = prior or {}
    proposed_phenomena = list(prior.get("proposedPhenomena", []))
    for proposed in spec.get("proposedPhenomena", []):
        if proposed not in proposed_phenomena:
            proposed_phenomena.append(proposed)
    return {
        "schemaVersion": SCHEMA_VERSION,
        "candidateId": candidate_id,
        "source": {
            "schemaVersion": SCHEMA_VERSION,
            "id": source_id,
            "sourceType": "article",
            "platform": "genderdysphoria.fyi",
            "nativeId": f"{chapter}:L{start}-L{end}",
            "url": url,
            "publishedAt": chapter_date(lines),
            "retrievedAt": imported_at,
            "language": "en",
            "text": text,
            "contentHash": content_hash,
            "relations": [],
            "collection": {
                "collector": COLLECTOR_NAME,
                "collectorVersion": COLLECTOR_VERSION,
                "runId": run_id,
            },
            "metadata": {
                "chapter": chapter,
                "section": heading,
                "lineStart": start,
                "lineEnd": end,
                "upstreamCommit": commit,
                "evidenceRole": (
                    "first_person_essay"
                    if spec.get("reportType") == "first_person_summary"
                    else "secondary_summary"
                ),
            },
        },
        "discovery": prior.get("discovery")
        or {
            "method": "curated_public_source",
            "sourceUrls": [url],
            "discoveredAt": imported_at,
            "context": spec.get("context")
            or "Gender Dysphoria Bible prose describing a candidate experience.",
            "query": None,
            "queryLanguage": "en",
        },
        "proposedPhenomena": proposed_phenomena,
        "review": prior.get("review")
        or {
            "status": "pending",
            "reportType": spec.get("reportType", "general_discourse"),
            "identityBasis": "not_required",
        },
        "availability": prior.get("availability")
        or {"status": "public", "checkedAt": imported_at},
        "publication": prior.get("publication")
        or {"status": "unpublished", "publishedAt": None},
    }


def write_json(path: Path, value: Any) -> None:
    write_private_text(
        path,
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )


def write_jsonl(path: Path, values: Iterable[dict[str, Any]]) -> None:
    write_private_text(
        path,
        "".join(
            json.dumps(value, ensure_ascii=False, sort_keys=True) + "\n"
            for value in values
        ),
    )


@private_path_transaction("output_path")
def import_passages(
    *,
    gdb_root: Path,
    specs_path: Path,
    output_path: Path,
    manifest_path: Path,
    imported_at: str | None = None,
    allow_removals: bool = False,
) -> dict[str, Any]:
    imported_at = imported_at or utc_now()
    run_id = f"run:gdb-passages:{imported_at.replace(':', '-')}"
    specs = read_specs(specs_path)
    existing = read_existing(output_path)
    commit = upstream_commit(gdb_root)
    candidates = []
    for spec in specs:
        chapter = str(spec.get("chapter") or "")
        start = spec.get("lineStart")
        end = spec.get("lineEnd")
        candidate_id = f"candidate:src:gdb-passage:{chapter}:L{start}-L{end}"
        candidates.append(
            passage_candidate(
                spec=spec,
                chapter_dir=gdb_root / "public" / "en",
                imported_at=imported_at,
                run_id=run_id,
                commit=commit,
                prior=existing.get(candidate_id),
            )
        )

    candidates.sort(key=lambda item: item["candidateId"])
    candidate_ids = {candidate["candidateId"] for candidate in candidates}
    removed_candidate_ids = sorted(set(existing) - candidate_ids)
    if removed_candidate_ids and not allow_removals:
        raise ImportFailure(
            "Import would remove existing candidates; review the specification "
            "change or use --allow-removals: "
            + ", ".join(removed_candidate_ids)
        )
    candidate_map = {candidate["candidateId"]: candidate for candidate in candidates}
    validation_errors = candidate_record_errors(candidate_map, Path("schemas"))
    if validation_errors:
        raise ImportFailure(
            "Imported passages failed validation: " + "; ".join(validation_errors)
        )
    write_jsonl(output_path, candidates)
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "id": run_id,
        "collector": COLLECTOR_NAME,
        "collectorVersion": COLLECTOR_VERSION,
        "startedAt": imported_at,
        "completedAt": imported_at,
        "status": "success",
        "candidateCount": len(candidates),
        "upstreamCommit": commit,
        "removedCandidateIds": removed_candidate_ids,
        "output": output_path.name,
    }
    write_json(manifest_path, manifest)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--gdb-root", type=Path, default=Path("../GenderDysphoria.fyi")
    )
    parser.add_argument(
        "--specs",
        type=Path,
        default=Path(".private-research/gdb-passage-specs.json"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(".private-research/gdb-passage-candidates.jsonl"),
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(".private-research/gdb-passage-import-manifest.json"),
    )
    parser.add_argument("--allow-removals", action="store_true")
    args = parser.parse_args()

    manifest = import_passages(
        gdb_root=args.gdb_root,
        specs_path=args.specs,
        output_path=args.output,
        manifest_path=args.manifest,
        allow_removals=args.allow_removals,
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
