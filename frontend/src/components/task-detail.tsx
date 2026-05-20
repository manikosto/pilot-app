"use client";

import type { Task } from "@/lib/api";

interface Props {
  task: Task;
}

export function TaskDetail({ task }: Props) {
  const created = new Date(task.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-2">
      <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">
        {task.title}
      </h3>
      {task.description ? (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
          {task.description}
        </p>
      ) : (
        <p className="text-[13px] text-zinc-400">No description</p>
      )}
      <p className="font-mono text-[11px] text-zinc-500">Created {created}</p>
    </div>
  );
}
