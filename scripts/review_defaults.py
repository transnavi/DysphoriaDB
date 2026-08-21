"""Defaults for the editorial review block of a source candidate."""

from __future__ import annotations

from typing import Any


def unknown_reporter() -> dict[str, Any]:
    """A reporter position that has not been determined from any source."""

    return {
        "direction": "unknown",
        "trajectory": "unspecified",
        "statedAs": None,
        "basis": "unstated",
    }
