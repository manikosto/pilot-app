"""Tests for GET /api/users/count."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app
from app.models import User


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def test_get_users_count_200(client: TestClient) -> None:
    response = client.get("/api/users/count")
    assert response.status_code == 200


def test_get_users_count_body_matches_seed(client: TestClient) -> None:
    response = client.get("/api/users/count")
    data = response.json()
    assert data == {"count": len(main_module.SEED_USERS)}


def test_get_users_count_content_type(client: TestClient) -> None:
    response = client.get("/api/users/count")
    assert "application/json" in response.headers["content-type"]


def test_get_users_count_is_non_negative_integer(client: TestClient) -> None:
    response = client.get("/api/users/count")
    count = response.json()["count"]
    assert isinstance(count, int)
    assert count >= 0


def test_post_users_count_405(client: TestClient) -> None:
    response = client.post("/api/users/count")
    assert response.status_code == 405


def test_get_users_count_no_auth_required(client: TestClient) -> None:
    response = client.get("/api/users/count")
    assert response.status_code == 200


def test_get_users_count_empty_seed(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main_module, "SEED_USERS", [])
    response = client.get("/api/users/count")
    assert response.status_code == 200
    assert response.json() == {"count": 0}
