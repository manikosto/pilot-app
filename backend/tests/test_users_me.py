"""Tests for GET /api/users/me."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import SEED_USERS

client = TestClient(app)
authed_client = TestClient(app, headers={"Authorization": "Bearer demo-token"})


# ---------------------------------------------------------------------------
# Scenario 1 & 2: authenticated GET → 200 with body exactly {"id": <int>}
#                 and JSON keys == {"id"} (no name, no email)
# ---------------------------------------------------------------------------

def test_me_returns_200():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert res.status_code == 200


def test_me_body_contains_only_id():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert — keys must be exactly {"id"}; name and email must be absent
    assert set(res.json().keys()) == {"id"}


def test_me_body_exact_shape():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert res.json() == {"id": SEED_USERS[0].id}


def test_me_id_is_integer():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert isinstance(res.json()["id"], int)


# Edge: name field must be absent
def test_me_name_field_absent():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert "name" not in res.json()


# Edge: email field must be absent
def test_me_email_field_absent():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert "email" not in res.json()


# Edge: id must be a positive integer (boundary — zero/negative are invalid user ids)
def test_me_id_is_positive():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert res.json()["id"] > 0


# Edge: response must be a JSON object, not a list or scalar
def test_me_response_is_object():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert isinstance(res.json(), dict)


# Edge: Content-Type header must indicate JSON
def test_me_response_content_type_is_json():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert "application/json" in res.headers["content-type"]


# ---------------------------------------------------------------------------
# Scenario 3: id value matches the authenticated user's id in the database
# ---------------------------------------------------------------------------

def test_me_id_matches_first_seed_user():
    # Arrange
    expected_id = SEED_USERS[0].id
    # Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert res.json()["id"] == expected_id


# Edge: calling endpoint twice returns the same id (idempotency)
def test_me_id_is_stable_across_calls():
    # Arrange / Act
    first = authed_client.get("/api/users/me").json()["id"]
    second = authed_client.get("/api/users/me").json()["id"]
    # Assert
    assert first == second


# Edge: id is not None / null
def test_me_id_is_not_none():
    # Arrange / Act
    res = authed_client.get("/api/users/me")
    # Assert
    assert res.json()["id"] is not None


# ---------------------------------------------------------------------------
# Scenario 4: unauthenticated GET → 401 and no user data in body
# ---------------------------------------------------------------------------

def test_me_unauthenticated_no_token_returns_401():
    # Arrange — request carries no Authorization header
    # Act
    res = client.get("/api/users/me")
    # Assert
    assert res.status_code == 401


def test_me_unauthenticated_invalid_bearer_token_returns_401():
    # Arrange
    headers = {"Authorization": "Bearer invalid-token"}
    # Act
    res = client.get("/api/users/me", headers=headers)
    # Assert
    assert res.status_code == 401


def test_me_unauthenticated_no_user_data_in_body():
    # Arrange — no auth
    # Act
    res = client.get("/api/users/me")
    # Assert
    assert res.status_code == 401
    body = res.json()
    assert "id" not in body
    assert "name" not in body
    assert "email" not in body


# ---------------------------------------------------------------------------
# Scenario 5: non-GET HTTP methods → 405 Method Not Allowed
# ---------------------------------------------------------------------------

def test_me_post_not_allowed():
    # Arrange / Act
    res = client.post("/api/users/me")
    # Assert
    assert res.status_code == 405


# Edge: PUT also not allowed
def test_me_put_not_allowed():
    # Arrange / Act
    res = client.put("/api/users/me")
    # Assert
    assert res.status_code == 405


# Edge: DELETE also not allowed
def test_me_delete_not_allowed():
    # Arrange / Act
    res = client.delete("/api/users/me")
    # Assert
    assert res.status_code == 405


# Edge: PATCH also not allowed
def test_me_patch_not_allowed():
    # Arrange / Act
    res = client.patch("/api/users/me")
    # Assert
    assert res.status_code == 405
