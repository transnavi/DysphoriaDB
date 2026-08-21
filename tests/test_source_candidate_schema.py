import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

from scripts.review_defaults import undetermined_subject


SCHEMA_DIR = Path(__file__).resolve().parents[1] / "schemas"


@pytest.fixture(scope="module")
def validator() -> Draft202012Validator:
    source = json.loads((SCHEMA_DIR / "source.schema.json").read_text(encoding="utf-8"))
    candidate_schema = json.loads(
        (SCHEMA_DIR / "source-candidate.schema.json").read_text(encoding="utf-8")
    )
    registry = Registry().with_resource(
        source["$id"], Resource.from_contents(source)
    )
    return Draft202012Validator(
        candidate_schema, registry=registry, format_checker=FormatChecker()
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
            "subject": undetermined_subject(),
        },
        "availability": {
            "status": "public",
            "checkedAt": "2026-08-20T00:00:00+00:00",
        },
        "publication": {"status": "unpublished", "publishedAt": None},
    }


def paths(validator: Draft202012Validator, value: dict) -> list[str]:
    return [error.json_path for error in validator.iter_errors(value)]


def messages(validator: Draft202012Validator, value: dict) -> list[str]:
    return [error.message for error in validator.iter_errors(value)]


def with_subject(**fields) -> dict:
    value = candidate()
    value["review"]["subject"].update(fields)
    return value


def test_an_undetermined_subject_validates(validator: Draft202012Validator) -> None:
    assert messages(validator, candidate()) == []


def test_the_fixture_resolves_the_referenced_source_schema(
    validator: Draft202012Validator,
) -> None:
    value = candidate()
    del value["source"]["contentHash"]

    assert any(
        "'contentHash' is a required property" in m for m in messages(validator, value)
    )


def test_format_checking_is_active(validator: Draft202012Validator) -> None:
    value = candidate()
    value["discovery"]["discoveredAt"] = "the day before yesterday"

    assert "$.discovery.discoveredAt" in paths(validator, value)


def test_review_requires_a_subject(validator: Draft202012Validator) -> None:
    value = candidate()
    del value["review"]["subject"]

    assert any(
        "'subject' is a required property" in m for m in messages(validator, value)
    )


def test_a_subject_needs_all_four_fields(validator: Draft202012Validator) -> None:
    value = candidate()
    del value["review"]["subject"]["basis"]

    assert any("'basis' is a required property" in m for m in messages(validator, value))


def test_a_subject_rejects_unknown_fields(validator: Draft202012Validator) -> None:
    value = with_subject(pronouns="she/her")

    assert any("'pronouns' was unexpected" in m for m in messages(validator, value))


@pytest.mark.parametrize(
    ("trajectory", "direction"),
    [
        ("mtf", "transmasculine"),
        ("mtf", "nonbinary"),
        ("ftm", "transfeminine"),
        ("mtx", "transfeminine"),
        ("ftx", "transmasculine"),
    ],
)
def test_a_trajectory_pins_its_direction(
    validator: Draft202012Validator, trajectory: str, direction: str
) -> None:
    value = with_subject(
        direction=direction, trajectory=trajectory, statedAs="example", basis="same_post"
    )

    assert "$.review.subject.direction" in paths(validator, value)


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
    value = with_subject(
        direction=direction, trajectory=trajectory, statedAs="example", basis="profile"
    )

    assert messages(validator, value) == []


@pytest.mark.parametrize("basis", ["undetermined", "unstated"])
def test_an_unsourced_basis_carries_no_position(
    validator: Draft202012Validator, basis: str
) -> None:
    value = with_subject(direction="transfeminine", trajectory="mtf", basis=basis)

    assert "$.review.subject.direction" in paths(validator, value)


@pytest.mark.parametrize("basis", ["undetermined", "unstated"])
def test_an_unsourced_basis_carries_no_wording(
    validator: Draft202012Validator, basis: str
) -> None:
    value = with_subject(statedAs="I am a trans woman", basis=basis)

    assert "$.review.subject.statedAs" in paths(validator, value)


@pytest.mark.parametrize("basis", ["same_post", "same_thread", "profile", "elsewhere_public"])
def test_a_sourced_position_must_quote_the_wording(
    validator: Draft202012Validator, basis: str
) -> None:
    absent = with_subject(direction="transfeminine", trajectory="mtf", basis=basis)
    empty = with_subject(
        direction="transfeminine", trajectory="mtf", statedAs="", basis=basis
    )

    assert "$.review.subject.statedAs" in paths(validator, absent)
    assert "$.review.subject.statedAs" in paths(validator, empty)


def test_a_position_without_a_trajectory_validates(
    validator: Draft202012Validator,
) -> None:
    value = with_subject(statedAs="祂、她、他、它", basis="profile")

    assert messages(validator, value) == []
