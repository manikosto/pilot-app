"use client";

import { useState } from "react";

interface TaskFormValues {
  title: string;
  description: string | null;
}

interface Props {
  initialValues?: TaskFormValues;
  onSubmit: (data: TaskFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function TaskForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div>
        <label htmlFor="task-title" className="sr-only">
          Title
        </label>
        <input
          id="task-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm font-medium focus:border-zinc-900 focus:outline-none"
          maxLength={200}
          required
        />
      </div>
      <div>
        <label htmlFor="task-description" className="sr-only">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={4}
          className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-[13px] leading-relaxed focus:border-zinc-900 focus:outline-none"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
