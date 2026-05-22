"use client";

import { useEffect, useState } from "react";
import { TaskCard, type Task } from "@/components/task-card";

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: "Fix",
    description: "",
    status: "todo",
    priority: "low",
    tags: [],
  },
  {
    id: 2,
    title: "Add user authentication and session management with OAuth2 providers",
    description:
      "Implement OAuth2 flow with Google and GitHub. Add session persistence, token refresh, and expiry handling with full integration test coverage.",
    status: "in-progress",
    priority: "high",
    tags: ["auth", "backend", "security", "oauth"],
  },
  {
    id: 3,
    title: "Update onboarding copy",
    description: "Revise the welcome screen headline.",
    status: "todo",
    priority: "low",
    tags: ["copy"],
  },
  {
    id: 4,
    title:
      "Migrate the entire data pipeline from the legacy ETL system to the new streaming architecture using Apache Kafka and Flink",
    description:
      "This involves rewriting all 47 transform stages, updating the schema registry, coordinating a dual-write period, and performing a zero-downtime cutover with rollback playbooks prepared for each step.",
    status: "in-progress",
    priority: "high",
    tags: ["infra", "data", "kafka", "flink", "migration"],
  },
  {
    id: 5,
    title: "Design new dashboard layout",
    description:
      "Produce Figma mocks for the redesigned analytics dashboard. Get sign-off from product before handoff to engineering.",
    status: "todo",
    priority: "medium",
    tags: ["design", "dashboard"],
  },
  {
    id: 6,
    title: "Write unit tests for billing module",
    description: "",
    status: "done",
    priority: "medium",
    tags: ["testing", "billing"],
  },
  {
    id: 7,
    title: "Patch CVE-2024-1234 in the image-processing service",
    description:
      "Upgrade the vulnerable library, rebuild the container image, run SAST scan, and deploy to all regions.",
    status: "in-progress",
    priority: "high",
    tags: ["security", "infra"],
  },
  {
    id: 8,
    title: "Set up CI",
    description: "Configure GitHub Actions for lint, test, and build.",
    status: "done",
    priority: "low",
    tags: ["ci"],
  },
  {
    id: 9,
    title: "Implement dark mode toggle",
    description:
      "Add a light/dark/system preference toggle in user settings. Persist selection to localStorage and apply via a CSS custom-property theme.",
    status: "todo",
    priority: "medium",
    tags: ["frontend", "a11y"],
  },
  {
    id: 10,
    title:
      "Conduct quarterly security audit of all third-party npm dependencies and update any packages flagged by Dependabot or the Snyk scan",
    description:
      "Triage each finding by severity, apply patches where available, document accepted risks for findings with no upstream fix, and update the SBOM.",
    status: "todo",
    priority: "high",
    tags: ["security", "dependencies"],
  },
];

function loadColorsFromStorage(): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const result: Record<number, string> = {};
    for (const task of MOCK_TASKS) {
      const stored = localStorage.getItem(`task-color:${task.id}`);
      if (stored) result[task.id] = stored;
    }
    return result;
  } catch {
    return {};
  }
}

export default function TasksPage() {
  const [cardColors, setCardColors] = useState<Record<number, string>>({});

  // Load persisted colors from localStorage on mount.
  useEffect(() => {
    setCardColors(loadColorsFromStorage());
  }, []);

  function handleColorChange(taskId: number, color: string) {
    setCardColors((prev) => {
      const next = { ...prev, [taskId]: color };
      try {
        localStorage.setItem(`task-color:${taskId}`, color);
      } catch {
        // ignore write failures (private browsing quota)
      }
      return next;
    });
  }

  const counts = {
    todo: MOCK_TASKS.filter((t) => t.status === "todo").length,
    "in-progress": MOCK_TASKS.filter((t) => t.status === "in-progress").length,
    done: MOCK_TASKS.filter((t) => t.status === "done").length,
  };

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
            Track work across your team. Cards are uniform size — long content
            is truncated.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-600">
            {MOCK_TASKS.length} tasks
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600">
          {counts.todo} to do
        </span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-medium text-blue-700">
          {counts["in-progress"]} in progress
        </span>
        <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-medium text-green-700">
          {counts.done} done
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_TASKS.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              cardColor={cardColors[task.id]}
              onColorChange={(color) => handleColorChange(task.id, color)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
