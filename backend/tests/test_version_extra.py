"""Edge-case and regression tests for GET /api/version — written by Tester."""

from __future__ import annotations

import importlib.metadata
import re
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app, _resolve_version

client = TestClient(app)


# ---------------------------------------------------------------------------
# Missing HTTP-method 405 cases (spec says "POST, PUT, etc.")
# ---------------------------------------------------------------------------


def test_delete_version_returns_405():
    # Arrange: no body, wrong method
    # Act
    resp = client.delete("/api/version")
    # Assert
    assert resp.status_code == 405


def test_patch_version_returns_405():
    # Arrange: no body, wrong method
    # Act
    resp = client.patch("/api/version")
    # Assert
    assert resp.status_code == 405


# ---------------------------------------------------------------------------
# Auth-header ignored (endpoint must not return 401 even when creds are wrong)
# ---------------------------------------------------------------------------


def test_get_version_with_garbage_auth_header_still_200():
    # Arrange: malformed bearer token that would fail any real auth check
    headers = {"Authorization": "Bearer totally-invalid-token-xyz"}
    # Act
    resp = client.get("/api/version", headers=headers)
    # Assert: endpoint is public; bad creds must not produce 401
    assert resp.status_code == 200


def test_get_version_with_valid_token_still_200():
    # Arrange: obtain a real session token via login
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "any"},
    )
    assert login_resp.status_code == 200, "login prerequisite failed"
    token = login_resp.json()["token"]
    # Act: call /api/version with a valid bearer token
    resp = client.get("/api/version", headers={"Authorization": f"Bearer {token}"})
    # Assert: endpoint is public regardless of auth state
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Response shape — no extra fields should leak
# ---------------------------------------------------------------------------


def test_get_version_response_has_exactly_two_keys():
    # Arrange: (none)
    # Act
    resp = client.get("/api/version")
    # Assert: contract is {"version": ..., "name": ...} and nothing else
    assert set(resp.json().keys()) == {"version", "name"}


# ---------------------------------------------------------------------------
# Version string format
# ---------------------------------------------------------------------------


def test_version_field_matches_semver_pattern():
    # Arrange: (none)
    # Act
    version = client.get("/api/version").json()["version"]
    # Assert: must be X.Y.Z (with optional pre-release suffix)
    assert re.match(r"^\d+\.\d+\.\d+", version), (
        f"version {version!r} does not look like semver"
    )


# ---------------------------------------------------------------------------
# _resolve_version() startup error path
# ---------------------------------------------------------------------------


def test_resolve_version_raises_runtime_error_when_no_version_field():
    # Arrange: importlib lookup fails AND pyproject.toml has no version keys
    with patch(
        "importlib.metadata.version",
        side_effect=importlib.metadata.PackageNotFoundError("pilot-app"),
    ):
        with patch("app.main.tomllib.load", return_value={}):
            # Act + Assert: must raise, not return None or ""
            with pytest.raises(RuntimeError, match="Could not resolve application version"):
                _resolve_version()


def test_resolve_version_raises_runtime_error_when_both_sections_present_but_empty():
    # Arrange: both [project] and [tool.poetry] exist but no version key in either
    empty_sections = {"project": {}, "tool": {"poetry": {}}}
    with patch(
        "importlib.metadata.version",
        side_effect=importlib.metadata.PackageNotFoundError("pilot-app"),
    ):
        with patch("app.main.tomllib.load", return_value=empty_sections):
            # Act + Assert
            with pytest.raises(RuntimeError, match="Could not resolve application version"):
                _resolve_version()
