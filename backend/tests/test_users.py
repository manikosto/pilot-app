import pytest
from fastapi.testclient import TestClient

import app.main as app_main
from app import models as app_models
from app.main import app
from app.models import User


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Scenario 1: GET /api/users → 200 with JSON array whose length == len(SEED_USERS)
# ---------------------------------------------------------------------------

def test_list_users_returns_200(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert
    assert response.status_code == 200


def test_list_users_response_is_json_array(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert
    assert response.headers["content-type"].startswith("application/json")
    assert isinstance(response.json(), list)


def test_list_users_length_matches_seed(client):
    # Arrange / Act
    response = client.get("/api/users")
    data = response.json()
    # Assert
    assert len(data) == len(app_models.SEED_USERS)


def test_list_users_single_item_seed_length(client, monkeypatch):
    # Arrange
    single = [User(id=99, email="solo@example.com", name="Solo")]
    monkeypatch.setattr(app_main, "SEED_USERS", single)
    # Act
    response = client.get("/api/users")
    data = response.json()
    # Assert
    assert response.status_code == 200
    assert len(data) == 1


# ---------------------------------------------------------------------------
# Scenario 2: each item has exactly the keys {id, email, name}
# ---------------------------------------------------------------------------

def test_list_users_item_keys(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert
    for item in response.json():
        assert set(item.keys()) == {"id", "email", "name"}


def test_list_users_id_is_int(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert — id type must be consistent with what SEED_USERS uses
    seed_id_type = type(app_models.SEED_USERS[0].id)
    for item in response.json():
        assert isinstance(item["id"], seed_id_type)


def test_list_users_email_is_string(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert
    for item in response.json():
        assert isinstance(item["email"], str)


def test_list_users_name_is_string_or_null(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert — name may be None (null) or str per model definition
    for item in response.json():
        assert item["name"] is None or isinstance(item["name"], str)


# ---------------------------------------------------------------------------
# Scenario 3: response order matches SEED_USERS order (compare ids in sequence)
# ---------------------------------------------------------------------------

def test_list_users_order_matches_seed(client):
    # Arrange
    seed_ids = [u.id for u in app_models.SEED_USERS]
    # Act
    response = client.get("/api/users")
    response_ids = [item["id"] for item in response.json()]
    # Assert
    assert response_ids == seed_ids


def test_list_users_order_is_idempotent(client):
    # Arrange / Act — call twice without any state change
    ids_first = [item["id"] for item in client.get("/api/users").json()]
    ids_second = [item["id"] for item in client.get("/api/users").json()]
    # Assert
    assert ids_first == ids_second


def test_list_users_order_respected_with_custom_seed(client, monkeypatch):
    # Arrange — reversed order relative to default
    custom = [
        User(id=20, email="z@example.com", name="Zara"),
        User(id=10, email="a@example.com", name="Aaron"),
    ]
    monkeypatch.setattr(app_main, "SEED_USERS", custom)
    # Act
    response = client.get("/api/users")
    ids = [item["id"] for item in response.json()]
    # Assert — must match the monkeypatched order, not sorted
    assert ids == [20, 10]


# ---------------------------------------------------------------------------
# Scenario 4: no item contains sensitive fields
# ---------------------------------------------------------------------------

SENSITIVE_FIELDS = {"password", "hashed_password", "token", "created_at", "secret"}


def test_list_users_no_sensitive_fields(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert
    for item in response.json():
        assert SENSITIVE_FIELDS.isdisjoint(item.keys())


def test_list_users_created_at_stripped(client):
    # Arrange — User model carries created_at; verify it is not leaked
    # Act
    response = client.get("/api/users")
    # Assert
    for item in response.json():
        assert "created_at" not in item


def test_list_users_exactly_three_fields(client):
    # Arrange / Act
    response = client.get("/api/users")
    # Assert — no extra fields beyond id, email, name
    for item in response.json():
        assert len(item) == 3


# ---------------------------------------------------------------------------
# Scenario 5: POST /api/users → 405 Method Not Allowed
# ---------------------------------------------------------------------------

def test_list_users_post_returns_405(client):
    # Arrange / Act
    response = client.post("/api/users")
    # Assert
    assert response.status_code == 405


def test_list_users_put_returns_405(client):
    # Arrange / Act
    response = client.put("/api/users")
    # Assert
    assert response.status_code == 405


def test_list_users_delete_returns_405(client):
    # Arrange / Act
    response = client.delete("/api/users")
    # Assert
    assert response.status_code == 405


# ---------------------------------------------------------------------------
# Scenario 6: GET /api/users when SEED_USERS is empty → 200 with []
# ---------------------------------------------------------------------------

def test_list_users_empty_seed(client, monkeypatch):
    # Arrange — patch the name inside app.main (where the handler reads it)
    monkeypatch.setattr(app_main, "SEED_USERS", [])
    # Act
    response = client.get("/api/users")
    # Assert
    assert response.status_code == 200
    assert response.json() == []


def test_list_users_large_seed(client, monkeypatch):
    # Arrange — five users; verifies length and no field bleeding
    large = [User(id=i, email=f"user{i}@example.com", name=f"User {i}") for i in range(5)]
    monkeypatch.setattr(app_main, "SEED_USERS", large)
    # Act
    response = client.get("/api/users")
    data = response.json()
    # Assert
    assert response.status_code == 200
    assert len(data) == 5
    for item in data:
        assert set(item.keys()) == {"id", "email", "name"}


def test_list_users_unicode_fields_survive(client, monkeypatch):
    # Arrange — special characters in name and email local part
    special = [User(id=1, email="测试@example.com", name="Ünïcödé Üser")]
    monkeypatch.setattr(app_main, "SEED_USERS", special)
    # Act
    response = client.get("/api/users")
    data = response.json()
    # Assert
    assert data[0]["name"] == "Ünïcödé Üser"
    assert data[0]["email"] == "测试@example.com"
