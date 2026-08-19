from pathlib import Path

import io
import json

from scripts.mine_archives import (
    fetch_x_metadata,
    sha256_file,
    telegram_export_fingerprint,
)


def test_telegram_export_fingerprint_is_stable(tmp_path: Path) -> None:
    (tmp_path / "messages2.html").write_text("second", encoding="utf-8")
    (tmp_path / "messages1.html").write_text("first", encoding="utf-8")

    first = telegram_export_fingerprint(tmp_path)
    second = telegram_export_fingerprint(tmp_path)

    assert first == second
    assert first["fileCount"] == 2
    assert len(first["contentHash"]) == 64
    assert sha256_file(tmp_path / "messages1.html")


def test_archive_hydration_rejects_mismatched_post_id(monkeypatch) -> None:
    payload = io.BytesIO(
        json.dumps(
            {"code": 200, "tweet": {"id": "456", "text": "wrong post"}}
        ).encode("utf-8")
    )
    monkeypatch.setattr("urllib.request.urlopen", lambda *args, **kwargs: payload)

    post_id, metadata = fetch_x_metadata("123")

    assert post_id == "123"
    assert metadata is None
