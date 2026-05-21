"use client";

import type { Task } from "@/types/task";

interface Props {
  task: Task;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  busy?: boolean;
}

export function TaskDeleteDialog({ task, onConfirm, onCancel, busy }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 className="text-[15px] font-semibold text-zinc-900">Delete task?</h2>
        <p className="mt-1.5 text-[13px] text-zinc-600">
          <span className="font-medium">"{task.title}"</span> will be permanently removed. This
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
