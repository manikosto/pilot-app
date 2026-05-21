"use client";

import { useCallback, useEffect, useState } from "react";

import { TaskFiltersBar } from "@/components/tasks/TaskFilters";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { api } from "@/lib/api";
import type { Task, TaskCreatePayload, TaskFilters, TaskUpdatePayload } from "@/types/task";

const DEFAULT_FILTERS: TaskFilters = {
  status: "",
  priority: "",
  sort_by: "created_at",
  order: "desc",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(
    async (activeFilters: TaskFilters) => {
      try {
        const result = await api.listTasks(activeFilters);
        setTasks(result.items);
        setTotal(result.total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
        setTasks([]);
      }
    },
    [],
  );

  useEffect(() => {
    void refresh(filters);
  }, [filters, refresh]);

  async function onCreate(payload: TaskCreatePayload) {
    await api.createTask(payload);
    setShowForm(false);
    await refresh(filters);
  }

  async function onUpdate(id: string, payload: TaskUpdatePayload) {
    await api.updateTask(id, payload);
    await refresh(filters);
  }

  async function onDelete(id: string) {
    await api.deleteTask(id);
    await refresh(filters);
  }

  function handleFiltersChange(next: TaskFilters) {
    setFilters(next);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track and manage work items across the project.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-600">
          {total} {total === 1 ? "task" : "tasks"}
        </span>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TaskFiltersBar filters={filters} onChange={handleFiltersChange} />
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex shrink-0 items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-zinc-800"
          >
            <span aria-hidden>+</span> New task
          </button>
        ) : null}
      </div>

      {showForm ? (
        <TaskForm
          onSubmit={onCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </div>
      ) : null}

      {tasks === null ? (
        <p className="text-sm text-zinc-500">Loading tasks…</p>
      ) : tasks.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {filters.status || filters.priority
              ? "No tasks match the current filters."
              : "No tasks yet — create one above."}
          </p>
        </div>
      ) : (
        <TaskList tasks={tasks} onUpdate={onUpdate} onDelete={onDelete} />
      )}
    </div>
  );
}
