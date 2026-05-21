"use client";

import type { TaskFilters } from "@/types/task";

interface Props {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

export function TaskFiltersBar({ filters, onChange }: Props) {
  function set<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value as TaskFilters["status"])}
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[12px] text-zinc-700 focus:border-zinc-900 focus:outline-none"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select
        value={filters.priority}
        onChange={(e) => set("priority", e.target.value as TaskFilters["priority"])}
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[12px] text-zinc-700 focus:border-zinc-900 focus:outline-none"
        aria-label="Filter by priority"
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <select
        value={`${filters.sort_by}:${filters.order}`}
        onChange={(e) => {
          const [sort_by, order] = e.target.value.split(":") as [
            TaskFilters["sort_by"],
            TaskFilters["order"],
          ];
          onChange({ ...filters, sort_by, order });
        }}
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[12px] text-zinc-700 focus:border-zinc-900 focus:outline-none"
        aria-label="Sort tasks"
      >
        <option value="created_at:desc">Newest first</option>
        <option value="created_at:asc">Oldest first</option>
        <option value="priority:desc">Priority: high → low</option>
        <option value="priority:asc">Priority: low → high</option>
      </select>

      {(filters.status || filters.priority) ? (
        <button
          type="button"
          onClick={() => onChange({ ...filters, status: "", priority: "" })}
          className="rounded-md px-2 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-900"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
