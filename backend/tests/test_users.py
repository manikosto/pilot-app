import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import models as app_models


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_list_users_returns_200(client):
    response = client.get("/api/users")
    assert response.status_code == 200


def test_list_users_length_matches_seed(client):
    response = client.get("/api/users")
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(app_models.SEED_USERS)


def test_list_users_item_keys(client):
    response = client.get("/api/users")
    for item in response.json():
        assert set(item.keys()) == {"id", "email", "name"}


def test_list_users_order_matches_seed(client):
    response = client.get("/api/users")
    data = response.json()
    seed_ids = [u.id for u in app_models.SEED_USERS]
    response_ids = [item["id"] for item in data]
    assert response_ids == seed_ids


def test_list_users_no_sensitive_fields(client):
    response = client.get("/api/users")
    forbidden = {"password", "hashed_password", "token", "created_at"}
    for item in response.json():
        assert forbidden.isdisjoint(item.keys())


def test_list_users_post_returns_405(client):
    response = client.post("/api/users")
    assert response.status_code == 405


def test_list_users_empty_seed(client, monkeypatch):
    monkeypatch.setattr(app_models, "SEED_USERS", [])
    response = client.get("/api/users")
    assert response.status_code == 200
    assert response.json() == []
