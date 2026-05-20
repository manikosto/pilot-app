import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_state() -> None:
    """Reset in-memory task and token state before each test."""
    main_module._TASKS.clear()
    main_module._NEXT_TASK_ID = 1
    main_module._TOKENS.clear()
    yield


@pytest.fixture
def token(client: TestClient) -> str:
    resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "x"},
    )
    return resp.json()["token"]
