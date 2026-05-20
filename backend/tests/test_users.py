"""Tests for /api/users/* endpoints."""
from __future__ import annotations

import app.main as main_module
from app.models import User
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_users_count_returns_200_with_count():
    response = client.get("/api/users/count")
    assert response.status_code == 200
    assert response.json() == {"count": len(main_module.SEED_USERS)}


def test_users_count_is_integer():
    response = client.get("/api/users/count")
    assert isinstance(response.json()["count"], int)


def test_users_count_post_returns_405():
    response = client.post("/api/users/count")
    assert response.status_code == 405


def test_users_count_empty_seed(monkeypatch):
    monkeypatch.setattr(main_module, "SEED_USERS", [])
    response = client.get("/api/users/count")
    assert response.status_code == 200
    assert response.json() == {"count": 0}


def test_users_count_only_count_key():
    response = client.get("/api/users/count")
    assert set(response.json().keys()) == {"count"}
