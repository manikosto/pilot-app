/** Thin browser-side wrapper around the pilot-app backend. */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001";

const TOKEN_KEY = "pilot_app.token";

export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (init.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = await res.json();
      detail = body?.detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
  logout: () =>
    request<void>("/api/auth/logout", { method: "POST" }).catch(() => undefined),
  me: () => request<User>("/api/users/me"),
  listNotes: () => request<Note[]>("/api/notes"),
  createNote: (body: { title: string; body: string; pinned?: boolean }) =>
    request<Note>("/api/notes", { method: "POST", body: JSON.stringify(body) }),
  updateNote: (
    id: number,
    body: { title?: string; body?: string; pinned?: boolean },
  ) =>
    request<Note>(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteNote: (id: number) =>
    request<void>(`/api/notes/${id}`, { method: "DELETE" }),
};
