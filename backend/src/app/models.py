"""Stub data models. No real DB in the demo — agent extends as needed."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import ClassVar

from pydantic import BaseModel, EmailStr, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(BaseModel):
    """A user record. In real life this would be in Postgres."""

    id: int
    email: EmailStr
    name: str | None = None
    created_at: datetime = Field(default_factory=_utcnow)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    token: str
    user: User


class Note(BaseModel):
    """A user's note. The agent is free to add tags, attachments, etc."""

    id: int
    user_id: int
    title: str
    body: str = ""
    pinned: bool = False
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(default="", max_length=10_000)
    pinned: bool = False


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, max_length=10_000)
    pinned: bool | None = None


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Task(BaseModel):
    id: str
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    assignee_id: str | None = None
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    assignee_id: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assignee_id: str | None = None


class TaskListResponse(BaseModel):
    items: list[Task]
    total: int
    page: int
    page_size: int


# In-memory user store used by the demo endpoints. The agent is free to
# replace this with a proper data layer when the spec requires it.
SEED_USERS: ClassVar[list[User]] = [
    User(id=1, email="alice@example.com", name="Alice"),
    User(id=2, email="bob@example.com", name="Bob"),
]

# Seed notes — one per user so the dashboard always has something to show
# right after signing in.
SEED_NOTES: ClassVar[list[Note]] = [
    Note(
        id=1,
        user_id=1,
        title="Welcome to pilot-app",
        body=(
            "This is a demo workspace. Approve a ticket in Jira with the "
            "`spec-approved` label and the AgentPipeline Coder will pick it "
            "up and modify this codebase on a feature branch."
        ),
        pinned=True,
    ),
    Note(
        id=2,
        user_id=1,
        title="Things to try",
        body=(
            "• Edit a note (PUT /api/notes/{id})\n"
            "• Pin it (PATCH-style toggle through PUT)\n"
            "• Delete it\n"
            "• Sign out and sign back in"
        ),
    ),
    Note(
        id=3,
        user_id=2,
        title="Bob's bookmarks",
        body="A short list of things Bob is reading.",
    ),
]

SEED_TASKS: list[Task] = [
    Task(
        id=str(uuid.uuid4()),
        title="Set up CI/CD pipeline",
        description="Configure GitHub Actions for automated testing and deployment.",
        status=TaskStatus.in_progress,
        priority=TaskPriority.high,
    ),
    Task(
        id=str(uuid.uuid4()),
        title="Write API documentation",
        description="Document all endpoints using OpenAPI spec.",
        status=TaskStatus.todo,
        priority=TaskPriority.medium,
    ),
    Task(
        id=str(uuid.uuid4()),
        title="Review pull requests",
        status=TaskStatus.todo,
        priority=TaskPriority.low,
    ),
]
