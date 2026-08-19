from pathlib import Path
import subprocess
import sys
import threading
import time

import pytest

from collectors.private_storage import (
    PrivatePathError,
    ensure_private_path,
    private_path_transaction,
    safe_path_label,
    write_private_text,
)


def test_ignored_research_path_is_private() -> None:
    ensure_private_path(Path(".private-research/example.json"))


def test_tracked_workspace_path_is_rejected() -> None:
    with pytest.raises(PrivatePathError, match="covered by .gitignore"):
        ensure_private_path(Path("data/example.json"))


def test_path_outside_repository_is_allowed(tmp_path: Path) -> None:
    ensure_private_path(tmp_path / "example.json")


def test_path_in_another_repository_is_rejected(tmp_path: Path) -> None:
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    with pytest.raises(PrivatePathError, match="covered by .gitignore"):
        ensure_private_path(tmp_path / "example.json")


def test_private_write_replaces_content_with_restricted_permissions(
    tmp_path: Path,
) -> None:
    path = tmp_path / "private" / "ledger.jsonl"
    write_private_text(path, "old\n")
    write_private_text(path, "new\n")

    assert path.read_text(encoding="utf-8") == "new\n"
    assert path.stat().st_mode & 0o777 == 0o600
    assert path.parent.stat().st_mode & 0o777 == 0o700


def test_safe_path_label_hides_parent_directories() -> None:
    label = safe_path_label(Path("/home/example/private/ledger.jsonl"))

    assert label == "ledger.jsonl"
    assert "example" not in label


def test_private_transactions_with_the_same_path_are_serialized(
    tmp_path: Path,
) -> None:
    active = 0
    maximum_active = 0

    @private_path_transaction("path")
    def transact(*, path: Path) -> None:
        nonlocal active, maximum_active
        active += 1
        maximum_active = max(maximum_active, active)
        time.sleep(0.03)
        active -= 1

    path = tmp_path / "ledger.jsonl"
    threads = [
        threading.Thread(target=transact, kwargs={"path": path})
        for _ in range(2)
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert maximum_active == 1


@pytest.mark.parametrize(
    "script",
    [
        "scripts/collect_x.py",
        "scripts/collect_x_discussion.py",
        "scripts/add_public_post_candidates.py",
        "scripts/add_public_article_candidates.py",
        "scripts/apply_candidate_reviews.py",
        "scripts/backfill_candidate_review_context.py",
        "scripts/import_gdb_sources.py",
        "scripts/import_gdb_passages.py",
        "scripts/migrate_article_excerpt_ids.py",
        "scripts/mine_archives.py",
    ],
)
def test_acquisition_scripts_run_directly(script: str) -> None:
    result = subprocess.run(
        [sys.executable, script, "--help"], check=False, capture_output=True, text=True
    )
    assert result.returncode == 0, result.stderr


def test_archive_hydration_requires_disclosure_acknowledgement() -> None:
    result = subprocess.run(
        [
            sys.executable,
            "scripts/mine_archives.py",
            "--x-archive",
            "archive.zip",
            "--telegram",
            "telegram",
            "--hydrate-samples",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 2
    assert "third-party provider" in result.stderr
