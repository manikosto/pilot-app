"""Stub data models. No real DB in the demo — agent extends as needed."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import ClassVar

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """A user record. In real life this would be in Postgres."""

    id: int
    email: EmailStr
    name: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    token: str
    user: User


class VersionResponse(BaseModel):
    version: str
    name: str


# In-memory user store used by the demo endpoints. The agent is free to
# replace this with a proper data layer when the spec requires it.
SEED_USERS: ClassVar[list[User]] = [
    User(id=1, email="alice@example.com", name="Alice"),
    User(id=2, email="bob@example.com", name="Bob"),
]
