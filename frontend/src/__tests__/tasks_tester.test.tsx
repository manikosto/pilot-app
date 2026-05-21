/**
 * Tester-added edge-case and regression tests for Tasks UI components.
 *
 * Covers: TaskCard edit/delete flows, TaskForm edit mode, TasksPage
 * loading state and priority filter — all gaps left by the Coder pass.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import TasksPage from "@/app/app/tasks/page";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import type { Task } from "@/types/task";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/tasks",
}));

vi.mock("@/lib/api", () => ({
  api: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

import { api } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockApi = api as any;

const SAMPLE_TASK: Task = {
  id: "task-1",
  title: "Fix login bug",
  description: "Users cannot log in with SSO",
  status: "in_progress",
  priority: "high",
  assignee_id: null,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
};

const EMPTY_RESPONSE = { items: [], total: 0, page: 1, page_size: 20 };

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// TasksPage — loading state
// ---------------------------------------------------------------------------

describe("TasksPage — loading state", () => {
  it("shows loading text before API call resolves", async () => {
    // Arrange — promise that never resolves during the assertion window
    let resolve!: (v: unknown) => void;
    mockApi.listTasks.mockReturnValue(new Promise((r) => { resolve = r; }));

    // Act
    render(<TasksPage />);

    // Assert — loading indicator visible immediately
    expect(screen.getByText(/Loading tasks/i)).toBeInTheDocument();

    // Cleanup — resolve to avoid act() warning on unmount
    resolve(EMPTY_RESPONSE);
  });
});

// ---------------------------------------------------------------------------
// TasksPage — priority filter
// ---------------------------------------------------------------------------

describe("TasksPage — priority filter", () => {
  it("re-fetches with priority param when priority filter changes", async () => {
    // Arrange
    const user = userEvent.setup();
    mockApi.listTasks.mockResolvedValue(EMPTY_RESPONSE);
    render(<TasksPage />);
    await waitFor(() => screen.getByText(/No tasks yet/i));

    // Act
    const prioritySelect = screen.getByRole("combobox", { name: /Filter by priority/i });
    await user.selectOptions(prioritySelect, "high");

    // Assert
    await waitFor(() => {
      expect(mockApi.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "high" }),
      );
    });
  });

  it("passes sort_by and order params when sort selection changes", async () => {
    // Arrange
    const user = userEvent.setup();
    mockApi.listTasks.mockResolvedValue(EMPTY_RESPONSE);
    render(<TasksPage />);
    await waitFor(() => screen.getByText(/No tasks yet/i));

    // Act — select "Priority: high → low"
    const sortSelect = screen.getByRole("combobox", { name: /Sort tasks/i });
    await user.selectOptions(sortSelect, "priority:desc");

    // Assert
    await waitFor(() => {
      expect(mockApi.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: "priority", order: "desc" }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TaskCard — edit flow
// ---------------------------------------------------------------------------

describe("TaskCard — edit flow", () => {
  it("shows TaskForm with Save changes button when Edit is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskCard task={SAMPLE_TASK} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    // Act
    await user.click(screen.getByRole("button", { name: /Edit/i }));

    // Assert
    expect(screen.getByRole("button", { name: /Save changes/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
  });

  it("calls onUpdate with the new title when edit form is submitted", async () => {
    // Arrange
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<TaskCard task={SAMPLE_TASK} onUpdate={onUpdate} onDelete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Edit/i }));

    // Act
    const titleInput = screen.getByPlaceholderText(/Task title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");
    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    // Assert
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({ title: "Updated title" }),
      );
    });
  });

  it("restores card view when Cancel is clicked in edit mode", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskCard task={SAMPLE_TASK} onUpdate={vi.fn()} onDelete={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Edit/i }));

    // Act
    await user.click(screen.getByRole("button", { name: /Cancel/i }));

    // Assert — back to card view
    expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save changes/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TaskCard — delete flow (card-level integration)
// ---------------------------------------------------------------------------

describe("TaskCard — delete flow", () => {
  it("shows delete confirmation dialog when Delete button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskCard task={SAMPLE_TASK} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    // Act
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));

    // Assert — dialog heading appears
    expect(screen.getByText("Delete task?")).toBeInTheDocument();
  });

  it("calls onDelete when delete dialog is confirmed", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<TaskCard task={SAMPLE_TASK} onUpdate={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));

    // Act — click the dialog's Delete button (scoped to avoid card's Delete button)
    const dialogHeading = screen.getByText("Delete task?");
    const dialogBox = dialogHeading.parentElement!;
    await user.click(within(dialogBox).getByRole("button", { name: /^Delete$/i }));

    // Assert
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("task-1");
    });
  });

  it("dismisses dialog without calling onDelete when Cancel is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TaskCard task={SAMPLE_TASK} onUpdate={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));

    // Act — cancel from the dialog
    const dialogHeading = screen.getByText("Delete task?");
    const dialogBox = dialogHeading.parentElement!;
    await user.click(within(dialogBox).getByRole("button", { name: /Cancel/i }));

    // Assert
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete task?")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TaskForm — edit mode vs create mode
// ---------------------------------------------------------------------------

describe("TaskForm — edit mode", () => {
  it("shows Save changes button (not Create task) when initial task is provided", () => {
    // Arrange + Act
    render(<TaskForm initial={SAMPLE_TASK} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: /Save changes/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create task/i })).not.toBeInTheDocument();
  });

  it("pre-fills title input with the initial task title", () => {
    // Arrange + Act
    render(<TaskForm initial={SAMPLE_TASK} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    const input = screen.getByPlaceholderText(/Task title/i) as HTMLInputElement;
    expect(input.value).toBe("Fix login bug");
  });
});

// ---------------------------------------------------------------------------
// TaskForm — title error clears on valid input
// ---------------------------------------------------------------------------

describe("TaskForm — title validation UX", () => {
  it("clears title validation error when user types a non-empty title", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    // Trigger the error
    await user.click(screen.getByRole("button", { name: /Create task/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Act — type a valid title
    await user.type(screen.getByPlaceholderText(/Task title/i), "a");

    // Assert — error message disappears
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TasksPage — error state does not render task list
// ---------------------------------------------------------------------------

describe("TasksPage — error state", () => {
  it("renders alert but no task grid when API call fails", async () => {
    // Arrange
    mockApi.listTasks.mockRejectedValue(new Error("Server error"));
    render(<TasksPage />);

    // Assert — error alert visible
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // Assert — no list items rendered
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });
});
