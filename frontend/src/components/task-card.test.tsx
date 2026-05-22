import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskCard, type Task } from "./task-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: "Default title",
    description: "Default description",
    status: "todo",
    priority: "low",
    tags: [],
    ...overrides,
  };
}

function getArticle(container: HTMLElement): HTMLElement {
  const el = container.querySelector("article");
  if (!el) throw new Error("article element not found");
  return el as HTMLElement;
}

// ---------------------------------------------------------------------------
// Spec scenario 1 — short title and long title produce the same fixed-height class
// ---------------------------------------------------------------------------

describe("Scenario: uniform card height regardless of title length", () => {
  it("short one-word title renders article with h-[160px] class", () => {
    // Arrange
    const { container } = render(<TaskCard task={makeTask({ title: "Fix" })} />);
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
  });

  it("full-length multi-line title renders article with the same h-[160px] class", () => {
    // Arrange
    const longTitle =
      "Add user authentication and session management with OAuth2 providers including token refresh and expiry";
    const { container } = render(<TaskCard task={makeTask({ title: longTitle })} />);
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 2 — very long title is clamped; card dimensions do not change
// ---------------------------------------------------------------------------

describe("Scenario: very long title is truncated and card does not grow", () => {
  it("title element has line-clamp-2 class to enforce ellipsis truncation", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ title: "A".repeat(300) })} />
    );
    // Act
    const heading = container.querySelector("h3");
    // Assert
    expect(heading?.className).toContain("line-clamp-2");
  });

  it("article retains overflow-hidden so overflowing content cannot stretch the card", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ title: "X".repeat(500) })} />
    );
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("overflow-hidden");
  });

  it("article still has h-[160px] with a very long title", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ title: "B".repeat(500) })} />
    );
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 3 — empty description keeps the same card height
// ---------------------------------------------------------------------------

describe("Scenario: empty description does not change card height", () => {
  it("card with empty description shows placeholder text and keeps h-[160px]", () => {
    // Arrange
    const { container } = render(<TaskCard task={makeTask({ description: "" })} />);
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
    expect(screen.getByText("No description")).toBeInTheDocument();
  });

  it("card with non-empty description also keeps h-[160px]", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ description: "Short desc" })} />
    );
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 4 — all cards in a mixed-content list share identical class names
// ---------------------------------------------------------------------------

describe("Scenario: multiple cards with mixed content all share identical structural classes", () => {
  const MIXED_TASKS: Task[] = [
    makeTask({ id: 1, title: "Fix", description: "" }),
    makeTask({ id: 2, title: "A".repeat(200), description: "B".repeat(400) }),
    makeTask({ id: 3, title: "Normal title", description: "Normal desc" }),
    makeTask({ id: 4, title: "Med title", description: "", tags: ["a", "b", "c", "d"] }),
    makeTask({ id: 5, title: "Another", description: "Some text", status: "done", priority: "high" }),
  ];

  it("every card article carries identical fixed-dimension classes", () => {
    // Arrange
    const { container } = render(
      <ul>
        {MIXED_TASKS.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} />
          </li>
        ))}
      </ul>
    );
    // Act
    const articles = Array.from(container.querySelectorAll("article"));
    // Assert — all 5 articles must have the same sizing signature
    expect(articles).toHaveLength(5);
    const classNames = articles.map((a) => a.className);
    const unique = new Set(classNames);
    // All cards are rendered with the same component so class strings must be identical
    expect(unique.size).toBe(1);
  });

  it("every card article has both h-[160px] and overflow-hidden", () => {
    // Arrange
    const { container } = render(
      <ul>
        {MIXED_TASKS.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} />
          </li>
        ))}
      </ul>
    );
    // Act
    const articles = Array.from(container.querySelectorAll("article"));
    // Assert
    for (const article of articles) {
      expect(article.className).toContain("h-[160px]");
      expect(article.className).toContain("overflow-hidden");
    }
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 5 — responsive classes enforce equal-width columns
// (Structural/class contract — actual layout cannot be measured in jsdom)
// ---------------------------------------------------------------------------

describe("Scenario: responsive grid enforces equal-width columns at all breakpoints", () => {
  it("article uses w-full so width is entirely grid-driven and never self-fixed in px", () => {
    // Arrange
    const { container } = render(<TaskCard task={makeTask()} />);
    // Act
    const article = getArticle(container);
    // Assert — w-full means the card fills its grid column at every viewport
    expect(article.className).toContain("w-full");
  });
});

// ---------------------------------------------------------------------------
// Edge cases — status badge rendering
// ---------------------------------------------------------------------------

describe("Edge: all status values render their labels", () => {
  it("todo status shows 'To do' badge", () => {
    // Arrange
    render(<TaskCard task={makeTask({ status: "todo" })} />);
    // Assert
    expect(screen.getByText("To do")).toBeInTheDocument();
  });

  it("in-progress status shows 'In progress' badge", () => {
    // Arrange
    render(<TaskCard task={makeTask({ status: "in-progress" })} />);
    // Assert
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("done status shows 'Done' badge", () => {
    // Arrange
    render(<TaskCard task={makeTask({ status: "done" })} />);
    // Assert
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases — priority badge rendering
// ---------------------------------------------------------------------------

describe("Edge: all priority values render their labels", () => {
  it.each(["low", "medium", "high"] as const)("%s priority renders its label text", (priority) => {
    // Arrange
    render(<TaskCard task={makeTask({ priority })} />);
    // Assert
    expect(screen.getByText(priority)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases — tag overflow collapse
// ---------------------------------------------------------------------------

describe("Edge: tag overflow collapses to +N indicator", () => {
  it("zero tags renders no tag spans and no +N indicator", () => {
    // Arrange
    const { container } = render(<TaskCard task={makeTask({ tags: [] })} />);
    // Act
    const footer = container.querySelector("footer");
    // Assert — only status + priority spans; no +N text
    expect(footer?.textContent).not.toContain("+");
  });

  it("exactly one tag renders that tag with no +N indicator", () => {
    // Arrange
    render(<TaskCard task={makeTask({ tags: ["alpha"] })} />);
    // Assert
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("exactly two tags renders both tags with no +N indicator", () => {
    // Arrange
    render(<TaskCard task={makeTask({ tags: ["alpha", "beta"] })} />);
    // Assert
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("three tags renders first two and +1 indicator", () => {
    // Arrange
    render(<TaskCard task={makeTask({ tags: ["a", "b", "c"] })} />);
    // Assert
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.queryByText("c")).toBeNull();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("five tags renders first two and +3 indicator", () => {
    // Arrange
    render(<TaskCard task={makeTask({ tags: ["a", "b", "c", "d", "e"] })} />);
    // Assert
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("card with many tags still retains h-[160px] and overflow-hidden", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ tags: ["t1", "t2", "t3", "t4", "t5", "t6"] })} />
    );
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
    expect(article.className).toContain("overflow-hidden");
  });
});

// ---------------------------------------------------------------------------
// Edge cases — boundary and special input
// ---------------------------------------------------------------------------

describe("Edge: boundary and special character inputs", () => {
  it("title with only whitespace still renders inside the heading element", () => {
    // Arrange
    render(<TaskCard task={makeTask({ title: "   " })} />);
    // Act
    const heading = screen.getByRole("heading", { level: 3 });
    // Assert — heading exists, card does not crash
    expect(heading).toBeInTheDocument();
  });

  it("title with Unicode multibyte characters renders without crashing", () => {
    // Arrange
    render(<TaskCard task={makeTask({ title: "修复登录问题 🚀 résoudre le bug" })} />);
    // Act
    const heading = screen.getByRole("heading", { level: 3 });
    // Assert
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("🚀");
  });

  it("description with Unicode renders the text, not the placeholder", () => {
    // Arrange
    render(<TaskCard task={makeTask({ description: "描述内容" })} />);
    // Assert
    expect(screen.queryByText("No description")).toBeNull();
  });

  it("very long single continuous word in title does not crash and card keeps h-[160px]", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ title: "a".repeat(1000) })} />
    );
    // Act
    const article = getArticle(container);
    // Assert
    expect(article.className).toContain("h-[160px]");
  });

  it("description paragraph has line-clamp-2 to limit overflow", () => {
    // Arrange
    const { container } = render(
      <TaskCard task={makeTask({ description: "D".repeat(1000) })} />
    );
    // Act
    const para = container.querySelector("p");
    // Assert
    expect(para?.className).toContain("line-clamp-2");
  });

  it("rendering the same task twice (idempotency) produces identical DOM class signatures", () => {
    // Arrange
    const task = makeTask({ title: "Idempotent", description: "Same", tags: ["x"] });
    const { container: c1 } = render(<TaskCard task={task} />);
    const { container: c2 } = render(<TaskCard task={task} />);
    // Act
    const article1 = getArticle(c1);
    const article2 = getArticle(c2);
    // Assert
    expect(article1.className).toBe(article2.className);
  });
});

// ---------------------------------------------------------------------------
// Backwards-compatibility contract — exported types
// ---------------------------------------------------------------------------

describe("Backwards compatibility: TaskCard API contract", () => {
  it("accepts a minimal Task with all required fields", () => {
    // Arrange — no optional fields present, ensuring the interface is stable
    const minimalTask: Task = {
      id: 99,
      title: "Minimal",
      description: "",
      status: "todo",
      priority: "low",
      tags: [],
    };
    // Act
    const { container } = render(<TaskCard task={minimalTask} />);
    // Assert
    expect(getArticle(container)).toBeInTheDocument();
  });
});
