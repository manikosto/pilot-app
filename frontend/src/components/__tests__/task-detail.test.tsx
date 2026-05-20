import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Task } from "@/lib/api";

import { TaskDetail } from "../task-detail";

const baseTask: Task = {
  id: 1,
  user_id: 1,
  title: "Test Task",
  description: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("TaskDetail", () => {
  it("renders description when present", () => {
    render(<TaskDetail task={{ ...baseTask, description: "task details here" }} />);
    expect(screen.getByText("task details here")).toBeInTheDocument();
  });

  it("shows placeholder when description is null and does not throw", () => {
    render(<TaskDetail task={{ ...baseTask, description: null }} />);
    expect(screen.getByText(/no description/i)).toBeInTheDocument();
  });

  it("renders the task title", () => {
    render(<TaskDetail task={baseTask} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });
});
