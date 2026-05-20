"use client";

import { useState } from "react";

interface Props {
  onSubmit: (body: {
    title: string;
    body: string;
    pinned: boolean;
  }) => Promise<void>;
}

export function NoteComposer({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
    setPinned(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ title: title.trim(), body, pinned });
      reset();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-zinc-900 text-[14px] font-medium text-white">
          +
        </span>
        New note…
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm font-medium focus:border-zinc-900 focus:outline-none"
        maxLength={200}
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write something…"
        rows={4}
        className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-[13px] leading-relaxed focus:border-zinc-900 focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-[12px] text-zinc-600">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="size-4 accent-amber-500"
          />
          Pin to top
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
            }}
            disabled={busy}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>
    </form>
  );
}
