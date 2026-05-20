"""Tests for /api/users/* endpoints."""
from __future__ import annotations

import app.main as main_module
from app.models import User
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Scenario: GET /api/users/count → 200 with body {"count": N}
# ---------------------------------------------------------------------------

def test_users_count_returns_200_with_count():
    response = client.get("/api/users/count")
    assert response.status_code == 200
    assert response.json() == {"count": len(main_module.SEED_USERS)}


def test_users_count_response_content_type_is_json():
    # EC: response must be application/json so callers can parse it
    response = client.get("/api/users/count")
    assert "application/json" in response.headers["content-type"]


def test_users_count_matches_seed_users_length():
    # EC: count must equal the actual list length, not a hard-coded value
    expected = len(main_module.SEED_USERS)
    response = client.get("/api/users/count")
    assert response.json()["count"] == expected


# ---------------------------------------------------------------------------
# Scenario: count is a JSON integer (not string)
# ---------------------------------------------------------------------------

def test_users_count_is_integer():
    response = client.get("/api/users/count")
    assert isinstance(response.json()["count"], int)


def test_users_count_is_not_float():
    # EC: JSON parses whole numbers as int; guard against a float leak
    count = response = client.get("/api/users/count").json()["count"]
    assert not isinstance(count, float)


def test_users_count_is_not_none():
    # EC: field must be present and non-null
    count = client.get("/api/users/count").json().get("count")
    assert count is not None


# ---------------------------------------------------------------------------
# Scenario: non-GET methods → 405
# ---------------------------------------------------------------------------

def test_users_count_post_returns_405():
    response = client.post("/api/users/count")
    assert response.status_code == 405


def test_users_count_put_returns_405():
    # EC: PUT is also a write method and must be rejected
    response = client.put("/api/users/count")
    assert response.status_code == 405


def test_users_count_delete_returns_405():
    # EC: DELETE must be rejected
    response = client.delete("/api/users/count")
    assert response.status_code == 405


# ---------------------------------------------------------------------------
# Scenario: SEED_USERS empty → {"count": 0}
# ---------------------------------------------------------------------------

def test_users_count_empty_seed(monkeypatch):
    monkeypatch.setattr(main_module, "SEED_USERS", [])
    response = client.get("/api/users/count")
    assert response.status_code == 200
    assert response.json() == {"count": 0}


def test_users_count_empty_seed_returns_int_zero(monkeypatch):
    # EC: zero must be int 0, not null or the string "0"
    monkeypatch.setattr(main_module, "SEED_USERS", [])
    count = client.get("/api/users/count").json()["count"]
    assert count == 0
    assert isinstance(count, int)


def test_users_count_single_user_seed(monkeypatch):
    # EC: boundary value — one user yields count == 1
    single = [User(id=99, email="solo@example.com", name="Solo")]
    monkeypatch.setattr(main_module, "SEED_USERS", single)
    response = client.get("/api/users/count")
    assert response.status_code == 200
    assert response.json() == {"count": 1}


# ---------------------------------------------------------------------------
# Scenario: response contains only the "count" key
# ---------------------------------------------------------------------------

def test_users_count_only_count_key():
    response = client.get("/api/users/count")
    assert set(response.json().keys()) == {"count"}


def test_users_count_response_is_object_not_list():
    # EC: body must be a JSON object, not an array
    body = client.get("/api/users/count").json()
    assert isinstance(body, dict)


def test_users_count_exactly_one_key():
    # EC: no extra fields (e.g. "users", "source", "message") may be present
    body = client.get("/api/users/count").json()
    assert len(body) == 1
