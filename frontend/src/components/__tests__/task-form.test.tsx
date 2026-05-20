import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskForm } from "../task-form";

describe("TaskForm", () => {
  it("renders description textarea for a new task", () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /description/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("");
  });

  it("does not block submission when description is blank", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} submitLabel="Save" />);
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "My Task" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("includes description in the submit payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} submitLabel="Save" />);
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "My Task" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "some detail" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: "My Task",
        description: "some detail",
      }),
    );
  });

  it("passes null for description when textarea is left blank", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} submitLabel="Save" />);
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "No Desc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: "No Desc",
        description: null,
      }),
    );
  });

  it("pre-populates description in edit mode", () => {
    render(
      <TaskForm
        onSubmit={vi.fn()}
        initialValues={{ title: "Existing", description: "existing desc" }}
      />,
    );
    expect(screen.getByRole("textbox", { name: /description/i })).toHaveValue(
      "existing desc",
    );
  });

  it("pre-populates title in edit mode", () => {
    render(
      <TaskForm
        onSubmit={vi.fn()}
        initialValues={{ title: "Existing Title", description: null }}
      />,
    );
    expect(screen.getByRole("textbox", { name: /title/i })).toHaveValue(
      "Existing Title",
    );
  });
});
