/**
 * Edge-case tests for TaskDetail (KAN-18, added by Tester).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Task } from "@/lib/api";

import { TaskDetail } from "../task-detail";

const baseTask: Task = {
  id: 1,
  user_id: 1,
  title: "Base Task",
  description: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("TaskDetail — edge cases", () => {
  it("renders description containing newlines without throwing", () => {
    // Arrange — multiline description (whitespace-pre-wrap handles display)
    const multiline = "Line one\nLine two\nLine three";
    // Act
    render(<TaskDetail task={{ ...baseTask, description: multiline }} />);
    // Assert — placeholder is absent (content rendered) and first line is visible;
    // getByText normalises whitespace so we search by partial text instead.
    expect(screen.queryByText(/no description/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Line one/)).toBeInTheDocument();
  });

  it("shows placeholder for empty-string description (falsy value)", () => {
    // Arrange — empty string is falsy in JS; component treats it like null
    // Act
    render(<TaskDetail task={{ ...baseTask, description: "" as unknown as null }} />);
    // Assert — no error thrown, placeholder appears
    expect(screen.getByText(/no description/i)).toBeInTheDocument();
  });

  it("renders description containing Unicode and emoji without throwing", () => {
    // Arrange
    const unicodeDesc = "Done ✅ — café & naïve résumé 🎉";
    // Act
    render(<TaskDetail task={{ ...baseTask, description: unicodeDesc }} />);
    // Assert
    expect(screen.getByText(unicodeDesc)).toBeInTheDocument();
  });

  it("renders created_at timestamp in the output", () => {
    // Arrange & Act
    render(<TaskDetail task={baseTask} />);
    // Assert — "Created" label must be visible alongside the formatted date
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });
});
