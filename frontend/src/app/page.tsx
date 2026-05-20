"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getToken } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) router.replace("/app");
  }, [router]);

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-start justify-center px-6 py-16">
      <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white">
        pilot-app
      </span>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight text-zinc-900">
        A workspace the agents practice on.
      </h1>
      <p className="mt-4 max-w-xl text-base text-zinc-600">
        Tiny demo product. Sign in to see and edit notes — features land here
        when the AgentPipeline Coder picks up a Jira spec.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Sign in →
        </Link>
        <a
          href="http://localhost:8002/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          API docs
        </a>
      </div>
    </main>
  );
}
