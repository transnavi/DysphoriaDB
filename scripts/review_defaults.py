"""Defaults for the editorial review block of a source candidate."""

from __future__ import annotations

from typing import Any


def undetermined_subject() -> dict[str, Any]:
    """A gender position nobody has looked for yet."""

    return {
        "direction": "unknown",
        "trajectory": "unspecified",
        "statedAs": None,
        "basis": "undetermined",
    }
