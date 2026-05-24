"""Tests for GET /api/version."""

import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_PYPROJECT_PATH = Path(__file__).parent.parent / "pyproject.toml"


def _pyproject_version() -> str:
    with open(_PYPROJECT_PATH, "rb") as f:
        data = tomllib.load(f)
    version = data.get("project", {}).get("version") or data.get("tool", {}).get(
        "poetry", {}
    ).get("version")
    assert version, "pyproject.toml must declare a version"
    return version


def test_get_version_200():
    resp = client.get("/api/version")
    assert resp.status_code == 200


def test_get_version_body():
    resp = client.get("/api/version")
    body = resp.json()
    assert body["version"] == "0.1.0"
    assert body["name"] == "pilot-app"


def test_get_version_no_auth_required():
    resp = client.get("/api/version")
    assert resp.status_code == 200


def test_post_version_405():
    resp = client.post("/api/version")
    assert resp.status_code == 405


def test_put_version_405():
    resp = client.put("/api/version")
    assert resp.status_code == 405


def test_get_version_content_type_json():
    resp = client.get("/api/version")
    assert "application/json" in resp.headers.get("content-type", "")


def test_version_matches_pyproject():
    resp = client.get("/api/version")
    assert resp.json()["version"] == _pyproject_version()


def test_name_is_pilot_app():
    resp = client.get("/api/version")
    assert resp.json()["name"] == "pilot-app"
