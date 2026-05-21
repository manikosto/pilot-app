"use client";

import type { Task, TaskUpdatePayload } from "@/types/task";
import { TaskCard } from "./TaskCard";

interface Props {
  tasks: Task[];
  onUpdate: (id: string, payload: TaskUpdatePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskList({ tasks, onUpdate, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">No tasks match the current filters.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskCard task={task} onUpdate={onUpdate} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
