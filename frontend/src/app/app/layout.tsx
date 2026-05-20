"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api, clearToken, getToken, type User } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        clearToken();
        router.replace("/login");
        return;
      }
      if (!cancelled) setChecked(true);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    await api.logout();
    clearToken();
    router.replace("/login");
  }

  if (!checked || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/app" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-zinc-900 text-[11px] font-semibold text-white">
              P
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              pilot-app
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-medium text-zinc-900">{user.name ?? user.email}</p>
              <p className="text-[11px] text-zinc-500">{user.email}</p>
            </div>
            <span
              className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-[12px] font-semibold uppercase text-white"
              aria-hidden
            >
              {(user.name ?? user.email).slice(0, 1)}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-[12px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
