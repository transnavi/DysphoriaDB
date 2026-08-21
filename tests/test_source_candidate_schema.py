import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

from scripts.review_defaults import unknown_reporter


SCHEMA_DIR = Path("schemas")


@pytest.fixture(scope="module")
def validator() -> Draft202012Validator:
    source = json.loads((SCHEMA_DIR / "source.schema.json").read_text(encoding="utf-8"))
    candidate = json.loads(
        (SCHEMA_DIR / "source-candidate.schema.json").read_text(encoding="utf-8")
    )
    registry = Registry().with_resource(
        source["$id"], Resource.from_contents(source)
    )
    return Draft202012Validator(
        candidate, registry=registry, format_checker=FormatChecker()
    )


def candidate() -> dict:
    return {
        "schemaVersion": "0.1.0",
        "candidateId": "candidate:src:example:1",
        "source": {
            "schemaVersion": "0.1.0",
            "id": "src:example:1",
            "sourceType": "social_post",
            "platform": "example",
            "nativeId": "1",
            "url": "https://example.com/1",
            "publishedAt": None,
            "retrievedAt": "2026-08-20T00:00:00+00:00",
            "language": "en",
            "text": "Example",
            "contentHash": "d" * 64,
            "relations": [],
            "collection": {
                "collector": "test",
                "collectorVersion": "0.1.0",
                "runId": "run:test",
            },
        },
        "discovery": {
            "method": "direct_public_post",
            "sourceUrls": ["https://example.com/1"],
            "discoveredAt": "2026-08-20T00:00:00+00:00",
        },
        "proposedPhenomena": [],
        "review": {
            "status": "pending",
            "reportType": "unknown",
            "identityBasis": "unknown",
            "reporter": unknown_reporter(),
        },
        "availability": {
            "status": "public",
            "checkedAt": "2026-08-20T00:00:00+00:00",
        },
        "publication": {"status": "unpublished", "publishedAt": None},
    }


def errors(validator: Draft202012Validator, value: dict) -> list[str]:
    return [error.message for error in validator.iter_errors(value)]


def test_an_undetermined_reporter_validates(validator: Draft202012Validator) -> None:
    assert errors(validator, candidate()) == []


def test_review_requires_a_reporter_position(
    validator: Draft202012Validator,
) -> None:
    value = candidate()
    del value["review"]["reporter"]

    assert any("'reporter' is a required property" in m for m in errors(validator, value))


def test_a_reporter_position_needs_all_four_fields(
    validator: Draft202012Validator,
) -> None:
    value = candidate()
    del value["review"]["reporter"]["basis"]

    assert any("'basis' is a required property" in m for m in errors(validator, value))


@pytest.mark.parametrize(
    ("trajectory", "direction"),
    [
        ("mtf", "transmasculine"),
        ("ftm", "transfeminine"),
        ("mtx", "transfeminine"),
        ("ftx", "transmasculine"),
    ],
)
def test_trajectory_and_direction_must_agree(
    validator: Draft202012Validator, trajectory: str, direction: str
) -> None:
    value = candidate()
    value["review"]["reporter"].update(
        {
            "direction": direction,
            "trajectory": trajectory,
            "statedAs": "example",
            "basis": "same_post",
        }
    )

    assert errors(validator, value) != []


@pytest.mark.parametrize(
    ("trajectory", "direction"),
    [
        ("mtf", "transfeminine"),
        ("ftm", "transmasculine"),
        ("mtx", "nonbinary"),
        ("ftx", "nonbinary"),
    ],
)
def test_an_agreeing_trajectory_validates(
    validator: Draft202012Validator, trajectory: str, direction: str
) -> None:
    value = candidate()
    value["review"]["reporter"].update(
        {
            "direction": direction,
            "trajectory": trajectory,
            "statedAs": "example",
            "basis": "profile",
        }
    )

    assert errors(validator, value) == []


def test_an_unstated_reporter_carries_no_position(
    validator: Draft202012Validator,
) -> None:
    value = candidate()
    value["review"]["reporter"].update(
        {"direction": "transfeminine", "trajectory": "mtf"}
    )

    assert errors(validator, value) != []


def test_a_position_without_a_trajectory_validates(
    validator: Draft202012Validator,
) -> None:
    value = candidate()
    value["review"]["reporter"].update(
        {
            "direction": "questioning",
            "statedAs": "祂、她、他、它",
            "basis": "profile",
        }
    )

    assert errors(validator, value) == []


def test_reporter_rejects_unknown_fields(validator: Draft202012Validator) -> None:
    value = candidate()
    value["review"]["reporter"]["pronouns"] = "she/her"

    assert any("'pronouns' was unexpected" in m for m in errors(validator, value))
