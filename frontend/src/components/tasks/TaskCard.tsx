"use client";

import { useState } from "react";

import type { Task, TaskUpdatePayload } from "@/types/task";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/types/task";
import { TaskDeleteDialog } from "./TaskDeleteDialog";
import { TaskForm } from "./TaskForm";

interface Props {
  task: Task;
  onUpdate: (id: string, payload: TaskUpdatePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-red-50 text-red-700",
};

const STATUS_COLORS: Record<Task["status"], string> = {
  todo: "bg-zinc-100 text-zinc-600",
  in_progress: "bg-amber-50 text-amber-700",
  done: "bg-green-50 text-green-700",
};

export function TaskCard({ task, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleUpdate(payload: TaskUpdatePayload) {
    setBusy(true);
    try {
      await onUpdate(task.id, payload);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(task.id);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  const updated = new Date(task.updated_at);
  const updatedLabel = updated.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (editing) {
    return (
      <TaskForm
        initial={task}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      {confirmDelete ? (
        <TaskDeleteDialog
          task={task}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          busy={busy}
        />
      ) : null}

      <article className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <header className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] font-semibold tracking-tight text-zinc-900">
            {task.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-60"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </header>

        {task.description ? (
          <p className="text-[13px] leading-relaxed text-zinc-600">{task.description}</p>
        ) : null}

        <footer className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[task.status]}`}
          >
            {STATUS_LABELS[task.status]}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[task.priority]}`}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className="ml-auto font-mono text-[10px] text-zinc-400">
            Updated {updatedLabel}
          </span>
        </footer>
      </article>
    </>
  );
}
