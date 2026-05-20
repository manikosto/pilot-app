"use client";

import { useCallback, useEffect, useState } from "react";

import { TaskDetail } from "@/components/task-detail";
import { TaskForm } from "@/components/task-form";
import { api, type Task } from "@/lib/api";

type EditingState = { taskId: number; values: { title: string; description: string | null } } | null;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EditingState>(null);

  const refresh = useCallback(async () => {
    try {
      const fresh = await api.listTasks();
      setTasks(fresh);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(data: { title: string; description: string | null }) {
    await api.createTask(data);
    setCreating(false);
    await refresh();
  }

  async function onUpdate(
    id: number,
    data: { title: string; description: string | null },
  ) {
    await api.updateTask(id, data);
    setEditing(null);
    await refresh();
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(id);
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
            Tasks
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track things that need to get done.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-600">
          {tasks?.length ?? 0} {tasks?.length === 1 ? "task" : "tasks"}
        </span>
      </header>

      {creating ? (
        <TaskForm
          onSubmit={onCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Add task"
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-left text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-zinc-900 text-[14px] font-medium text-white">
            +
          </span>
          New task…
        </button>
      )}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      ) : null}

      {tasks === null ? (
        <p className="text-sm text-zinc-500">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No tasks yet — add one above.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              {editing?.taskId === t.id ? (
                <TaskForm
                  initialValues={editing.values}
                  onSubmit={(data) => onUpdate(t.id, data)}
                  onCancel={() => setEditing(null)}
                  submitLabel="Save changes"
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <TaskDetail task={t} />
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          taskId: t.id,
                          values: { title: t.title, description: t.description },
                        })
                      }
                      className="rounded-md px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="rounded-md px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
