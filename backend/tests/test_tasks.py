"""Happy-path tests for the /api/tasks endpoints (KAN-18)."""

from fastapi.testclient import TestClient


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_create_task_with_description(client: TestClient, token: str) -> None:
    resp = client.post(
        "/api/tasks",
        json={"title": "My Task", "description": "do the thing"},
        headers=auth(token),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["description"] == "do the thing"
    assert body["title"] == "My Task"
    assert "id" in body


def test_create_task_without_description(client: TestClient, token: str) -> None:
    resp = client.post(
        "/api/tasks",
        json={"title": "No Desc Task"},
        headers=auth(token),
    )
    assert resp.status_code == 201
    assert resp.json()["description"] is None


def test_get_task_returns_description(client: TestClient, token: str) -> None:
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Detailed Task", "description": "details here"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    get_resp = client.get(f"/api/tasks/{task_id}", headers=auth(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["description"] == "details here"


def test_patch_task_description(client: TestClient, token: str) -> None:
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Patchable Task"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    patch_resp = client.patch(
        f"/api/tasks/{task_id}",
        json={"description": "updated text"},
        headers=auth(token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["description"] == "updated text"


def test_patch_task_description_null_clears_field(client: TestClient, token: str) -> None:
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Clear Desc Task", "description": "initial"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    patch_resp = client.patch(
        f"/api/tasks/{task_id}",
        json={"description": None},
        headers=auth(token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["description"] is None


def test_patch_task_no_description_field_preserves_value(client: TestClient, token: str) -> None:
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Preserve Desc Task", "description": "keep this"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    patch_resp = client.patch(
        f"/api/tasks/{task_id}",
        json={"title": "Updated Title"},
        headers=auth(token),
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["description"] == "keep this"
    assert patch_resp.json()["title"] == "Updated Title"


def test_get_task_no_description_returns_null(client: TestClient, token: str) -> None:
    create_resp = client.post(
        "/api/tasks",
        json={"title": "Null Desc Task"},
        headers=auth(token),
    )
    task_id = create_resp.json()["id"]
    get_resp = client.get(f"/api/tasks/{task_id}", headers=auth(token))
    assert get_resp.status_code == 200
    assert get_resp.json()["description"] is None


def test_get_task_404_for_unknown_id(client: TestClient, token: str) -> None:
    resp = client.get("/api/tasks/9999", headers=auth(token))
    assert resp.status_code == 404


def test_list_tasks_returns_only_current_users_tasks(client: TestClient, token: str) -> None:
    client.post("/api/tasks", json={"title": "Alice's Task"}, headers=auth(token))
    resp = client.get("/api/tasks", headers=auth(token))
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Alice's Task"
