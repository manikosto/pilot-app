"use client";

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
}

interface Props {
  task: Task;
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-zinc-100 text-zinc-600",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-emerald-50 text-emerald-600",
  medium: "bg-amber-50 text-amber-600",
  high: "bg-red-50 text-red-600",
};

export function TaskCard({ task }: Props) {
  return (
    <article
      className={[
        // Fixed dimensions — width driven by grid column, height always 160px.
        // overflow-hidden prevents any content from stretching the card.
        "flex h-[160px] w-full flex-col overflow-hidden",
        "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm",
        "transition-shadow hover:shadow-md",
      ].join(" ")}
    >
      {/* Title — at most 2 lines, then ellipsis */}
      <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
        {task.title}
      </h3>

      {/* Description — fills remaining space, at most 2 lines */}
      <p className="mt-1.5 line-clamp-2 flex-1 overflow-hidden text-[12px] leading-relaxed text-zinc-500">
        {task.description || <span className="italic">No description</span>}
      </p>

      {/* Footer — status + priority + tags, shrinks-0 so it never moves */}
      <footer className="mt-auto flex shrink-0 items-center gap-1.5 overflow-hidden">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500"
          >
            {tag}
          </span>
        ))}
        {task.tags.length > 2 && (
          <span className="shrink-0 text-[10px] text-zinc-400">
            +{task.tags.length - 2}
          </span>
        )}
      </footer>
    </article>
  );
}
