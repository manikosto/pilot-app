"use client";

import { useState } from "react";

import type { Task, TaskCreatePayload, TaskPriority, TaskStatus, TaskUpdatePayload } from "@/types/task";

type FormPayload = TaskCreatePayload & TaskUpdatePayload;

interface Props {
  initial?: Task;
  onSubmit: (payload: FormPayload) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "medium");
  const [busy, setBusy] = useState(false);
  const [titleError, setTitleError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setTitleError("");
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
      });
    } finally {
      setBusy(false);
    }
  }

  const isEdit = Boolean(initial);

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      noValidate
    >
      <div>
        <input
          autoFocus
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) setTitleError("");
          }}
          placeholder="Task title *"
          maxLength={500}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium focus:outline-none ${
            titleError
              ? "border-red-400 focus:border-red-500"
              : "border-zinc-300 focus:border-zinc-900"
          }`}
        />
        {titleError ? (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {titleError}
          </p>
        ) : null}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={3}
        className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-[13px] leading-relaxed focus:border-zinc-900 focus:outline-none"
      />

      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[12px] text-zinc-700 focus:border-zinc-900 focus:outline-none"
          aria-label="Status"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[12px] text-zinc-700 focus:border-zinc-900 focus:outline-none"
          aria-label="Priority"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
