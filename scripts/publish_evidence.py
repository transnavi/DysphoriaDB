"""Build the site evidence module from reviewed reports."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


def build_module(records: list[dict[str, str]]) -> str:
    ranking: Counter[str] = Counter()
    samples: dict[str, list[dict[str, str]]] = defaultdict(list)

    for record in records:
        claim = record["claim"]
        ranking[claim] += 1
        samples[claim].append(
            {
                "url": record["url"],
                "author": record["author"],
                "handle": record.get("handle", ""),
                "excerpt": record["excerpt"],
                "relation": record.get("relation", ""),
            }
        )

    return (
        "export const evidenceRanking = "
        + json.dumps(dict(ranking), ensure_ascii=False, indent=2)
        + ";\n\nexport const evidenceSamples = "
        + json.dumps(dict(samples), ensure_ascii=False, indent=2)
        + ";\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/approved-evidence.json"))
    parser.add_argument("--output", type=Path, default=Path("site/approved-evidence.js"))
    args = parser.parse_args()

    records = json.loads(args.input.read_text(encoding="utf-8"))
    args.output.write_text(build_module(records), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
