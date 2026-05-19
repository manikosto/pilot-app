"""Tests for GET /api/version."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_version_returns_200_with_payload():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json() == {"version": "0.1.0", "name": "pilot-app"}


def test_get_version_content_type_is_json():
    response = client.get("/api/version")
    assert "application/json" in response.headers["content-type"]


def test_post_version_returns_405():
    response = client.post("/api/version")
    assert response.status_code == 405


def test_get_version_requires_no_auth():
    response = client.get("/api/version")
    assert response.status_code == 200
    assert response.json() == {"version": "0.1.0", "name": "pilot-app"}


def test_healthz_unaffected():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
