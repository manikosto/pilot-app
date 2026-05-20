"""Tests for GET /api/users/me."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import SEED_USERS

client = TestClient(app)


def test_me_returns_200():
    res = client.get("/api/users/me")
    assert res.status_code == 200


def test_me_body_contains_only_id():
    res = client.get("/api/users/me")
    assert set(res.json().keys()) == {"id"}


def test_me_body_exact_shape():
    res = client.get("/api/users/me")
    assert res.json() == {"id": SEED_USERS[0].id}


def test_me_id_is_integer():
    res = client.get("/api/users/me")
    assert isinstance(res.json()["id"], int)


def test_me_post_not_allowed():
    res = client.post("/api/users/me")
    assert res.status_code == 405
