import json
from pathlib import Path

import pytest

import scripts.collect_x as collect_x


def test_collect_writes_latest_and_run_snapshot(
    tmp_path: Path, monkeypatch
) -> None:
    timestamps = iter(
        [
            "2026-08-20T00:00:00+00:00",
            "2026-08-20T00:00:01+00:00",
            "2026-08-20T00:00:02+00:00",
        ]
    )
    monkeypatch.setattr(collect_x, "utc_now", lambda: next(timestamps))
    monkeypatch.setattr(
        collect_x,
        "fetch_status",
        lambda ref: {
            "tweet": {
                "id": ref.post_id,
                "text": "An experience",
                "author": {"id": "author-1", "screen_name": "example"},
            }
        },
    )

    manifest = collect_x.collect(
        ["https://x.com/example/status/123"], tmp_path
    )

    latest = tmp_path / "normalized" / "x" / "123.json"
    snapshot = (
        tmp_path
        / "snapshots"
        / manifest["snapshotKey"]
        / "normalized"
        / "x"
        / "123.json"
    )
    assert json.loads(latest.read_text(encoding="utf-8")) == json.loads(
        snapshot.read_text(encoding="utf-8")
    )
    assert (
        tmp_path
        / "snapshots"
        / manifest["snapshotKey"]
        / "raw"
        / "x"
        / "123.json"
    ).exists()
    assert manifest["status"] == "success"


def test_collect_preserves_snapshot_if_latest_write_fails(
    tmp_path: Path, monkeypatch
) -> None:
    timestamps = iter(
        [
            "2026-08-20T00:00:00+00:00",
            "2026-08-20T00:00:01+00:00",
        ]
    )
    monkeypatch.setattr(collect_x, "utc_now", lambda: next(timestamps))
    monkeypatch.setattr(
        collect_x,
        "fetch_status",
        lambda ref: {
            "tweet": {
                "id": ref.post_id,
                "text": "An experience",
                "author": {"id": "author-1", "screen_name": "example"},
            }
        },
    )
    original_write_json = collect_x.write_json

    def fail_latest_raw(path: Path, value) -> None:
        if path == tmp_path / "raw" / "x" / "123.json":
            raise OSError("injected latest-write failure")
        original_write_json(path, value)

    monkeypatch.setattr(collect_x, "write_json", fail_latest_raw)

    with pytest.raises(OSError, match="injected"):
        collect_x.collect(["https://x.com/example/status/123"], tmp_path)

    snapshots = list(
        (tmp_path / "snapshots").glob("*/raw/x/123.json")
    )
    assert len(snapshots) == 1
