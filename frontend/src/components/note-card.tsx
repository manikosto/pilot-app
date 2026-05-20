"use client";

import { useState } from "react";

import type { Note } from "@/lib/api";

interface Props {
  note: Note;
  onUpdate: (
    id: number,
    patch: { title?: string; body?: string; pinned?: boolean },
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function NoteCard({ note, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await onUpdate(note.id, { title, body });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function togglePin() {
    setBusy(true);
    try {
      await onUpdate(note.id, { pinned: !note.pinned });
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!confirm("Delete this note?")) return;
    setBusy(true);
    try {
      await onDelete(note.id);
    } finally {
      setBusy(false);
    }
  }

  const updated = new Date(note.updated_at);
  const updatedLabel = updated.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        note.pinned ? "border-amber-300/70" : "border-zinc-200"
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium focus:border-zinc-900 focus:outline-none"
            maxLength={200}
          />
        ) : (
          <h3 className="line-clamp-2 text-[15px] font-semibold tracking-tight text-zinc-900">
            {note.title}
          </h3>
        )}
        <button
          type="button"
          onClick={togglePin}
          disabled={busy}
          className={`shrink-0 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors ${
            note.pinned
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          }`}
          title={note.pinned ? "Unpin" : "Pin"}
        >
          {note.pinned ? "★ Pinned" : "☆"}
        </button>
      </header>

      <div className="mt-2 flex-1">
        {editing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-[13px] leading-relaxed focus:border-zinc-900 focus:outline-none"
          />
        ) : (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
            {note.body || (
              <span className="text-zinc-400">No body</span>
            )}
          </p>
        )}
      </div>

      <footer className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
        <span className="font-mono">Updated {updatedLabel}</span>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setTitle(note.title);
                  setBody(note.body);
                  setEditing(false);
                }}
                disabled={busy}
                className="rounded-md px-2 py-1 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy || title.trim().length === 0}
                className="rounded-md bg-zinc-900 px-2 py-1 font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={busy}
                className="rounded-md px-2 py-1 hover:bg-zinc-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={destroy}
                disabled={busy}
                className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
