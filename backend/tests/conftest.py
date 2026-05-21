"""Shared fixtures for backend tests."""

import pytest
from fastapi.testclient import TestClient

import app.main as app_module
from app.main import app


@pytest.fixture(autouse=True)
def reset_tasks_state():
    """Isolate each test: start with an empty task store."""
    app_module._TASKS.clear()
    yield
    app_module._TASKS.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "any"},
    )
    assert resp.status_code == 200
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}
