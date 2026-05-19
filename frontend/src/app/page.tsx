import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">pilot-app</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Target codebase for the Agent Pipeline Coder agent. Features are
        implemented from approved Jira specs.
      </p>
      <div className="mt-8 space-y-2 text-sm">
        <Link
          href="/login"
          className="inline-block rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
        >
          Sign in
        </Link>
        <div>
          <Link
            href="/about"
            className="text-sm text-zinc-500 underline hover:text-zinc-900"
          >
            About
          </Link>
        </div>
      </div>
    </main>
  );
}
