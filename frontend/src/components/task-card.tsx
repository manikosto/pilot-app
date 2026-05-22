"use client";

import { useRef, useState } from "react";
import { ColorPickerPopover } from "./ColorPickerPopover";

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
  cardColor?: string;
  onColorChange?: (color: string) => void;
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

export function TaskCard({ task, cardColor, onColorChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <article
      className={[
        "relative flex h-[160px] w-full flex-col overflow-hidden",
        "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm",
        "transition-shadow hover:shadow-md",
      ].join(" ")}
      style={cardColor ? { backgroundColor: cardColor } : undefined}
    >
      {/* Palette icon button — absolute within the card area, does not push layout */}
      <button
        ref={paletteButtonRef}
        type="button"
        aria-label="Pick card color"
        aria-expanded={pickerOpen}
        aria-haspopup="dialog"
        className="absolute right-2 top-2 flex size-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        onClick={() => setPickerOpen((v) => !v)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      </button>

      {/* Title — pr-6 keeps text clear of the palette button */}
      <h3 className="line-clamp-2 pr-6 text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
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

      {pickerOpen && (
        <ColorPickerPopover
          anchorEl={paletteButtonRef.current}
          currentColor={cardColor}
          onChange={(color) => onColorChange?.(color)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </article>
  );
}
