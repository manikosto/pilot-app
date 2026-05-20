/**
 * Edge-case tests for TaskForm (KAN-18, added by Tester).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskForm } from "../task-form";

describe("TaskForm — edge cases", () => {
  it("submits null for whitespace-only description", async () => {
    // Arrange — description made of blanks only
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} submitLabel="Save" />);
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "Task" },
    });
    // Act
    fireEvent.change(screen.getByRole("textbox", { name: /description/i }), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    // Assert — trim() || null collapses whitespace to null
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ title: "Task", description: null }),
    );
  });

  it("textarea is empty when initialValues.description is null", () => {
    // Arrange
    render(
      <TaskForm
        onSubmit={vi.fn()}
        initialValues={{ title: "Existing", description: null }}
      />,
    );
    // Assert
    expect(screen.getByRole("textbox", { name: /description/i })).toHaveValue("");
  });

  it("does not call onSubmit when title is empty", async () => {
    // Arrange — title left blank
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} submitLabel="Save" />);
    // Act — do NOT change title; click submit
    const submitBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitBtn);
    // Assert — onSubmit must not be called (blank title guard)
    await new Promise((r) => setTimeout(r, 50));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", () => {
    // Arrange
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} submitLabel="Save" />);
    // Act
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("trims leading/trailing whitespace from the title before submit", async () => {
    // Arrange
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} submitLabel="Save" />);
    // Act
    fireEvent.change(screen.getByRole("textbox", { name: /title/i }), {
      target: { value: "  Trimmed Title  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    // Assert — title is trimmed in the payload
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Trimmed Title" }),
      ),
    );
  });
});
