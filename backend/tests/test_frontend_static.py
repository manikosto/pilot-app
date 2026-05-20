"""
Scenario 6 (frontend): static analysis — verify that no frontend source file
reads `name` or `email` from the /api/users/me response.

Tests use pathlib to scan frontend/src and assert invariants without running
a browser or JS runtime.
"""

import re
from pathlib import Path

# Resolve frontend/src relative to this test file's repo location.
_REPO_ROOT = Path(__file__).resolve().parents[2]
_FRONTEND_SRC = _REPO_ROOT / "frontend" / "src"

_TS_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}


def _frontend_source_files() -> list[Path]:
    """Return all TS/JS source files under frontend/src."""
    return [
        p for p in _FRONTEND_SRC.rglob("*")
        if p.is_file() and p.suffix in _TS_EXTENSIONS
    ]


# ---------------------------------------------------------------------------
# Scenario 6: frontend no longer references name/email from /me
# ---------------------------------------------------------------------------

def test_frontend_src_dir_exists():
    # Arrange / Assert
    assert _FRONTEND_SRC.is_dir(), f"Expected frontend/src at {_FRONTEND_SRC}"


def test_no_frontend_file_fetches_users_me_and_reads_name():
    # Arrange
    me_pattern = re.compile(r"users/me")
    name_pattern = re.compile(r"\bname\b")

    offenders: list[str] = []
    for path in _frontend_source_files():
        # Act
        text = path.read_text(encoding="utf-8")
        if me_pattern.search(text) and name_pattern.search(text):
            offenders.append(str(path.relative_to(_REPO_ROOT)))

    # Assert — no file may both reference users/me and access .name
    assert offenders == [], (
        "These frontend files reference /users/me AND access .name — "
        "remove the .name access: " + ", ".join(offenders)
    )


def test_no_frontend_file_fetches_users_me_and_reads_email():
    # Arrange
    me_pattern = re.compile(r"users/me")
    email_pattern = re.compile(r"\bemail\b")

    offenders: list[str] = []
    for path in _frontend_source_files():
        # Act
        text = path.read_text(encoding="utf-8")
        if me_pattern.search(text) and email_pattern.search(text):
            offenders.append(str(path.relative_to(_REPO_ROOT)))

    # Assert — no file may both reference users/me and access .email
    assert offenders == [], (
        "These frontend files reference /users/me AND access .email — "
        "remove the .email access: " + ", ".join(offenders)
    )


def test_no_frontend_type_declares_name_on_me_response():
    """
    Edge: verify no TS interface/type named after the /me response shape
    declares a `name` field.
    """
    # Arrange — look for type/interface definitions that have both a me-related
    # name and a `name:` or `name?:` field declaration.
    type_block_pattern = re.compile(
        r"(?:interface|type)\s+\w*(?:Me|User)\w*\s*[={][^}]*\bname\b[^}]*}",
        re.DOTALL,
    )

    offenders: list[str] = []
    for path in _frontend_source_files():
        # Act
        text = path.read_text(encoding="utf-8")
        if type_block_pattern.search(text):
            offenders.append(str(path.relative_to(_REPO_ROOT)))

    # Assert
    assert offenders == [], (
        "These files declare a Me/User type that still includes `name`: "
        + ", ".join(offenders)
    )


def test_no_frontend_type_declares_email_on_me_response():
    """
    Edge: verify no TS interface/type named after the /me response shape
    declares an `email` field.
    """
    # Arrange
    type_block_pattern = re.compile(
        r"(?:interface|type)\s+\w*(?:Me|User)\w*\s*[={][^}]*\bemail\b[^}]*}",
        re.DOTALL,
    )

    offenders: list[str] = []
    for path in _frontend_source_files():
        # Act
        text = path.read_text(encoding="utf-8")
        if type_block_pattern.search(text):
            offenders.append(str(path.relative_to(_REPO_ROOT)))

    # Assert
    assert offenders == [], (
        "These files declare a Me/User type that still includes `email`: "
        + ", ".join(offenders)
    )
