"""Keep source-acquisition output outside tracked repository paths."""

from __future__ import annotations

import os
import fcntl
import inspect
import subprocess
import tempfile
from contextlib import contextmanager
from functools import wraps
from pathlib import Path
from typing import Any, Callable, Iterator, TypeVar


Result = TypeVar("Result")


class PrivatePathError(RuntimeError):
    """Raised when acquisition output could enter version control."""


def safe_path_label(path: Path) -> str:
    """Return a path label that cannot disclose a local directory name."""

    return path.name or "."


@contextmanager
def private_path_lock(path: Path) -> Iterator[None]:
    """Hold an advisory lock for a private read-modify-write transaction."""

    ensure_private_path(path)
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(path.parent, 0o700)
    lock_path = path.parent / f".{path.name}.lock"
    ensure_private_path(lock_path)
    descriptor = os.open(lock_path, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        fcntl.flock(descriptor, fcntl.LOCK_EX)
        yield
    finally:
        fcntl.flock(descriptor, fcntl.LOCK_UN)
        os.close(descriptor)


def private_path_transaction(
    path_parameter: str,
) -> Callable[[Callable[..., Result]], Callable[..., Result]]:
    """Lock the private path named by a function parameter for the whole call."""

    def decorate(function: Callable[..., Result]) -> Callable[..., Result]:
        signature = inspect.signature(function)

        @wraps(function)
        def wrapped(*args: Any, **kwargs: Any) -> Result:
            arguments = signature.bind(*args, **kwargs)
            path = Path(arguments.arguments[path_parameter])
            with private_path_lock(path):
                return function(*args, **kwargs)

        return wrapped

    return decorate


def _repository_root(path: Path) -> Path | None:
    search_from = path if path.is_dir() else path.parent
    while not search_from.exists() and search_from != search_from.parent:
        search_from = search_from.parent
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=search_from,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    return Path(result.stdout.strip()).resolve()


def ensure_private_path(path: Path) -> None:
    """Reject repository output unless Git confirms that it is ignored."""

    resolved = path.resolve()
    root = _repository_root(resolved)
    if root is None:
        return
    relative = resolved.relative_to(root)

    result = subprocess.run(
        ["git", "check-ignore", "--no-index", "--quiet", "--", str(relative)],
        cwd=root,
        check=False,
    )
    if result.returncode != 0:
        raise PrivatePathError(
            "Acquisition output inside the repository must be covered by .gitignore"
        )


def write_private_text(path: Path, text: str) -> None:
    ensure_private_path(path)
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(path.parent, 0o700)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=path.parent,
        prefix=f".{path.name}.",
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            output.write(text)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary_name, 0o600)
        os.replace(temporary_name, path)
    except BaseException:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise
    os.chmod(path, 0o600)
