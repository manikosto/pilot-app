"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("…");
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setStatus(res.ok ? "Signed in" : `Error: ${res.status}`);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="block text-xs text-zinc-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-1.5 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Sign in
        </button>
        {status ? <p className="text-xs text-zinc-500">{status}</p> : null}
      </form>
    </main>
  );
}
