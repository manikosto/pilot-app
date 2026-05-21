/**
 * Happy-path tests for the Tasks UI components.
 *
 * The api module is mocked so tests run without a real backend.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import TasksPage from "@/app/app/tasks/page";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskDeleteDialog } from "@/components/tasks/TaskDeleteDialog";
import type { Task } from "@/types/task";

// ---------------------------------------------------------------------------
// Mock next/navigation (used by layout, not by tasks page directly, but
// required so the module resolves without Next.js runtime)
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/app/tasks",
}));

// ---------------------------------------------------------------------------
// Mock the api module
// ---------------------------------------------------------------------------
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
const ONE_TASK_RESPONSE = { items: [SAMPLE_TASK], total: 1, page: 1, page_size: 20 };

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// TasksPage — list rendering
// ---------------------------------------------------------------------------

describe("TasksPage", () => {
  it("renders task card when API returns data", async () => {
    mockApi.listTasks.mockResolvedValue(ONE_TASK_RESPONSE);
    render(<TasksPage />);
    await waitFor(() => {
      expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    });
  });

  it("shows empty state when API returns no tasks", async () => {
    mockApi.listTasks.mockResolvedValue(EMPTY_RESPONSE);
    render(<TasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });
  });

  it("shows error message when API call fails", async () => {
    mockApi.listTasks.mockRejectedValue(new Error("Network error"));
    render(<TasksPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    });
  });

  it("new task appears in list after successful create", async () => {
    const user = userEvent.setup();
    mockApi.listTasks
      .mockResolvedValueOnce(EMPTY_RESPONSE)
      .mockResolvedValue(ONE_TASK_RESPONSE);
    mockApi.createTask.mockResolvedValue(SAMPLE_TASK);

    render(<TasksPage />);
    await waitFor(() => screen.getByText(/No tasks yet/i));

    await user.click(screen.getByRole("button", { name: /New task/i }));
    const titleInput = screen.getByPlaceholderText(/Task title/i);
    await user.type(titleInput, "Fix login bug");
    await user.click(screen.getByRole("button", { name: /Create task/i }));

    await waitFor(() => {
      expect(mockApi.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Fix login bug" }),
      );
      expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    });
  });

  it("applies status filter and refetches", async () => {
    const user = userEvent.setup();
    mockApi.listTasks.mockResolvedValue(ONE_TASK_RESPONSE);
    render(<TasksPage />);
    await waitFor(() => screen.getByText("Fix login bug"));

    const statusSelect = screen.getByRole("combobox", { name: /Filter by status/i });
    await user.selectOptions(statusSelect, "in_progress");

    await waitFor(() => {
      expect(mockApi.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: "in_progress" }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TaskForm — validation
// ---------------------------------------------------------------------------

describe("TaskForm", () => {
  it("shows validation error and does not call onSubmit when title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /Create task/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Title is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with title when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.type(screen.getByPlaceholderText(/Task title/i), "New task title");
    await user.click(screen.getByRole("button", { name: /Create task/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New task title" }),
      );
    });
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TaskDeleteDialog
// ---------------------------------------------------------------------------

describe("TaskDeleteDialog", () => {
  it("calls onConfirm when Delete button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    render(
      <TaskDeleteDialog task={SAMPLE_TASK} onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <TaskDeleteDialog task={SAMPLE_TASK} onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
