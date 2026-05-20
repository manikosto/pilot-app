"""FastAPI app for pilot-app."""

from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import LoginRequest, LoginResponse, SEED_USERS, User, UserMeResponse

app = FastAPI(title="pilot-app", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3010"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo token store: maps issued tokens to users.
_TOKEN_MAP: dict[str, User] = {"demo-token": SEED_USERS[0]}


def _current_user(authorization: str | None = Header(default=None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ")
    user = _TOKEN_MAP.get(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    user = next((u for u in SEED_USERS if u.email == payload.email), None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    return LoginResponse(token="demo-token", user=user)


@app.get("/api/users/me", response_model=UserMeResponse)
async def me(user: User = Depends(_current_user)) -> UserMeResponse:
    return UserMeResponse(id=user.id)
