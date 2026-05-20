"use client";

import { useCallback, useEffect, useState } from "react";

import { NoteCard } from "@/components/note-card";
import { NoteComposer } from "@/components/note-composer";
import { api, type Note } from "@/lib/api";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const fresh = await api.listNotes();
      setNotes(fresh);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(body: { title: string; body: string; pinned: boolean }) {
    await api.createNote(body);
    await refresh();
  }
  async function onUpdate(
    id: number,
    patch: { title?: string; body?: string; pinned?: boolean },
  ) {
    await api.updateNote(id, patch);
    await refresh();
  }
  async function onDelete(id: number) {
    await api.deleteNote(id);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Notes
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            A tiny notepad. Pinned notes float to the top.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-600">
          {notes?.length ?? 0} {notes?.length === 1 ? "note" : "notes"}
        </span>
      </header>

      <NoteComposer onSubmit={onCreate} />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      ) : null}

      {notes === null ? (
        <p className="text-sm text-zinc-500">Loading notes…</p>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No notes yet — write one above.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id}>
              <NoteCard note={n} onUpdate={onUpdate} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
