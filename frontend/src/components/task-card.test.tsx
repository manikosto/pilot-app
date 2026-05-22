import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { TaskCard, type Task } from "./task-card";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { TASK_CARD_PALETTE } from "@/lib/constants/taskCardPalette";
import TasksPage from "@/app/app/tasks/page";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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
    const { container } = render(<TaskCard task={makeTask({ title: "Fix" })} />);
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
  });

  it("full-length multi-line title renders article with the same h-[160px] class", () => {
    const longTitle =
      "Add user authentication and session management with OAuth2 providers including token refresh and expiry";
    const { container } = render(<TaskCard task={makeTask({ title: longTitle })} />);
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 2 — very long title is clamped; card dimensions do not change
// ---------------------------------------------------------------------------

describe("Scenario: very long title is truncated and card does not grow", () => {
  it("title element has line-clamp-2 class to enforce ellipsis truncation", () => {
    const { container } = render(
      <TaskCard task={makeTask({ title: "A".repeat(300) })} />
    );
    const heading = container.querySelector("h3");
    expect(heading?.className).toContain("line-clamp-2");
  });

  it("article retains overflow-hidden so overflowing content cannot stretch the card", () => {
    const { container } = render(
      <TaskCard task={makeTask({ title: "X".repeat(500) })} />
    );
    const article = getArticle(container);
    expect(article.className).toContain("overflow-hidden");
  });

  it("article still has h-[160px] with a very long title", () => {
    const { container } = render(
      <TaskCard task={makeTask({ title: "B".repeat(500) })} />
    );
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 3 — empty description keeps the same card height
// ---------------------------------------------------------------------------

describe("Scenario: empty description does not change card height", () => {
  it("card with empty description shows placeholder text and keeps h-[160px]", () => {
    const { container } = render(<TaskCard task={makeTask({ description: "" })} />);
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
    expect(screen.getByText("No description")).toBeInTheDocument();
  });

  it("card with non-empty description also keeps h-[160px]", () => {
    const { container } = render(
      <TaskCard task={makeTask({ description: "Short desc" })} />
    );
    const article = getArticle(container);
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
    const { container } = render(
      <ul>
        {MIXED_TASKS.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} />
          </li>
        ))}
      </ul>
    );
    const articles = Array.from(container.querySelectorAll("article"));
    expect(articles).toHaveLength(5);
    const classNames = articles.map((a) => a.className);
    const unique = new Set(classNames);
    expect(unique.size).toBe(1);
  });

  it("every card article has both h-[160px] and overflow-hidden", () => {
    const { container } = render(
      <ul>
        {MIXED_TASKS.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} />
          </li>
        ))}
      </ul>
    );
    const articles = Array.from(container.querySelectorAll("article"));
    for (const article of articles) {
      expect(article.className).toContain("h-[160px]");
      expect(article.className).toContain("overflow-hidden");
    }
  });
});

// ---------------------------------------------------------------------------
// Spec scenario 5 — responsive classes enforce equal-width columns
// ---------------------------------------------------------------------------

describe("Scenario: responsive grid enforces equal-width columns at all breakpoints", () => {
  it("article uses w-full so width is entirely grid-driven and never self-fixed in px", () => {
    const { container } = render(<TaskCard task={makeTask()} />);
    const article = getArticle(container);
    expect(article.className).toContain("w-full");
  });
});

// ---------------------------------------------------------------------------
// Edge cases — status badge rendering
// ---------------------------------------------------------------------------

describe("Edge: all status values render their labels", () => {
  it("todo status shows 'To do' badge", () => {
    render(<TaskCard task={makeTask({ status: "todo" })} />);
    expect(screen.getByText("To do")).toBeInTheDocument();
  });

  it("in-progress status shows 'In progress' badge", () => {
    render(<TaskCard task={makeTask({ status: "in-progress" })} />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("done status shows 'Done' badge", () => {
    render(<TaskCard task={makeTask({ status: "done" })} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases — priority badge rendering
// ---------------------------------------------------------------------------

describe("Edge: all priority values render their labels", () => {
  it.each(["low", "medium", "high"] as const)("%s priority renders its label text", (priority) => {
    render(<TaskCard task={makeTask({ priority })} />);
    expect(screen.getByText(priority)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases — tag overflow collapse
// ---------------------------------------------------------------------------

describe("Edge: tag overflow collapses to +N indicator", () => {
  it("zero tags renders no tag spans and no +N indicator", () => {
    const { container } = render(<TaskCard task={makeTask({ tags: [] })} />);
    const footer = container.querySelector("footer");
    expect(footer?.textContent).not.toContain("+");
  });

  it("exactly one tag renders that tag with no +N indicator", () => {
    render(<TaskCard task={makeTask({ tags: ["alpha"] })} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("exactly two tags renders both tags with no +N indicator", () => {
    render(<TaskCard task={makeTask({ tags: ["alpha", "beta"] })} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("three tags renders first two and +1 indicator", () => {
    render(<TaskCard task={makeTask({ tags: ["a", "b", "c"] })} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.queryByText("c")).toBeNull();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("five tags renders first two and +3 indicator", () => {
    render(<TaskCard task={makeTask({ tags: ["a", "b", "c", "d", "e"] })} />);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("card with many tags still retains h-[160px] and overflow-hidden", () => {
    const { container } = render(
      <TaskCard task={makeTask({ tags: ["t1", "t2", "t3", "t4", "t5", "t6"] })} />
    );
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
    expect(article.className).toContain("overflow-hidden");
  });
});

// ---------------------------------------------------------------------------
// Edge cases — boundary and special input
// ---------------------------------------------------------------------------

describe("Edge: boundary and special character inputs", () => {
  it("title with only whitespace still renders inside the heading element", () => {
    render(<TaskCard task={makeTask({ title: "   " })} />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();
  });

  it("title with Unicode multibyte characters renders without crashing", () => {
    render(<TaskCard task={makeTask({ title: "修复登录问题 🚀 résoudre le bug" })} />);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("🚀");
  });

  it("description with Unicode renders the text, not the placeholder", () => {
    render(<TaskCard task={makeTask({ description: "描述内容" })} />);
    expect(screen.queryByText("No description")).toBeNull();
  });

  it("very long single continuous word in title does not crash and card keeps h-[160px]", () => {
    const { container } = render(
      <TaskCard task={makeTask({ title: "a".repeat(1000) })} />
    );
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
  });

  it("description paragraph has line-clamp-2 to limit overflow", () => {
    const { container } = render(
      <TaskCard task={makeTask({ description: "D".repeat(1000) })} />
    );
    const para = container.querySelector("p");
    expect(para?.className).toContain("line-clamp-2");
  });

  it("rendering the same task twice (idempotency) produces identical DOM class signatures", () => {
    const task = makeTask({ title: "Idempotent", description: "Same", tags: ["x"] });
    const { container: c1 } = render(<TaskCard task={task} />);
    const { container: c2 } = render(<TaskCard task={task} />);
    const article1 = getArticle(c1);
    const article2 = getArticle(c2);
    expect(article1.className).toBe(article2.className);
  });
});

// ---------------------------------------------------------------------------
// Backwards-compatibility contract — exported types
// ---------------------------------------------------------------------------

describe("Backwards compatibility: TaskCard API contract", () => {
  it("accepts a minimal Task with all required fields", () => {
    const minimalTask: Task = {
      id: 99,
      title: "Minimal",
      description: "",
      status: "todo",
      priority: "low",
      tags: [],
    };
    const { container } = render(<TaskCard task={minimalTask} />);
    expect(getArticle(container)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Color picker — TaskCard rendering
// ---------------------------------------------------------------------------

describe("TaskCard rendering: cardColor prop", () => {
  it("rendered without cardColor prop → no inline background-color style on article", () => {
    const { container } = render(<TaskCard task={makeTask()} />);
    const article = getArticle(container);
    expect(article.style.backgroundColor).toBe("");
  });

  it('rendered with cardColor="#FCA5A5" → article has that inline background color', () => {
    const { container } = render(
      <TaskCard task={makeTask()} cardColor="#FCA5A5" />
    );
    const article = getArticle(container);
    expect(article.style.backgroundColor).not.toBe("");
  });

  it("palette icon button clicked → ColorPickerPopover becomes visible in the DOM", () => {
    render(<TaskCard task={makeTask()} onColorChange={() => {}} />);
    const btn = screen.getByLabelText("Pick card color");
    fireEvent.click(btn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("palette icon button clicked a second time → ColorPickerPopover is removed from the DOM", () => {
    render(<TaskCard task={makeTask()} onColorChange={() => {}} />);
    const btn = screen.getByLabelText("Pick card color");
    fireEvent.click(btn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Color picker — ColorPickerPopover component
// ---------------------------------------------------------------------------

describe("ColorPickerPopover component", () => {
  it("renders exactly 8 swatch buttons", () => {
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={undefined}
        onChange={() => {}}
        onClose={() => {}}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("button")).toHaveLength(8);
  });

  it("clicking a swatch calls onChange with the correct hex value", () => {
    const onChange = vi.fn();
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={undefined}
        onChange={onChange}
        onClose={() => {}}
      />
    );
    const redColor = TASK_CARD_PALETTE.find((c) => c.id === "red")!;
    const redBtn = screen.getByLabelText(redColor.label);
    fireEvent.click(redBtn);
    expect(onChange).toHaveBeenCalledWith(redColor.hexValue);
  });

  it("clicking a swatch calls onClose", () => {
    const onClose = vi.fn();
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={undefined}
        onChange={() => {}}
        onClose={onClose}
      />
    );
    const firstSwatch = screen.getByLabelText(TASK_CARD_PALETTE[0].label);
    fireEvent.click(firstSwatch);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Escape key press calls onClose", () => {
    const onClose = vi.fn();
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={undefined}
        onChange={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("mousedown outside the popover calls onClose", () => {
    const onClose = vi.fn();
    const { baseElement } = render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={undefined}
        onChange={() => {}}
        onClose={onClose}
      />
    );
    // baseElement is document.body; firing mousedown on it is "outside" the portal div
    fireEvent.mouseDown(baseElement);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Color state persistence within session
// ---------------------------------------------------------------------------

describe("Color state persistence within session", () => {
  it("card shows color stored in localStorage after page mounts", () => {
    localStorage.setItem("task-color:1", "#FCA5A5");
    const { container } = render(<TasksPage />);
    // Task id=1 is the first card in MOCK_TASKS
    const articles = container.querySelectorAll("article");
    expect(articles[0].style.backgroundColor).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// Layout regression — color picker must not break existing dimensions
// ---------------------------------------------------------------------------

describe("Layout regression: color picker does not alter card dimensions", () => {
  it("TaskCard with cardColor set → h-[160px] and overflow-hidden still present on article", () => {
    const { container } = render(
      <TaskCard task={makeTask()} cardColor="#93C5FD" />
    );
    const article = getArticle(container);
    expect(article.className).toContain("h-[160px]");
    expect(article.className).toContain("overflow-hidden");
  });

  it("picker open → status badge, priority badge, and tag elements still in card DOM subtree", () => {
    const { container } = render(
      <TaskCard
        task={makeTask({ status: "done", priority: "high", tags: ["alpha", "beta"] })}
        onColorChange={() => {}}
      />
    );
    const btn = screen.getByLabelText("Pick card color");
    fireEvent.click(btn);

    // Scope to the card's article element (not the portaled popover)
    const article = getArticle(container);
    expect(within(article).getByText("Done")).toBeInTheDocument();
    expect(within(article).getByText("high")).toBeInTheDocument();
    expect(within(article).getByText("alpha")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility: aria-expanded on the palette toggle button
// ---------------------------------------------------------------------------

describe("Accessibility: aria-expanded reflects picker open/closed state", () => {
  it("palette button has aria-expanded=false when picker is closed", () => {
    render(<TaskCard task={makeTask()} />);
    const btn = screen.getByLabelText("Pick card color");
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("palette button has aria-expanded=true after it is clicked open", () => {
    render(<TaskCard task={makeTask()} />);
    const btn = screen.getByLabelText("Pick card color");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("palette button returns to aria-expanded=false after picker is closed", () => {
    render(<TaskCard task={makeTask()} />);
    const btn = screen.getByLabelText("Pick card color");
    fireEvent.click(btn); // open
    fireEvent.click(btn); // close
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});

// ---------------------------------------------------------------------------
// Accessibility: aria-pressed on swatch buttons
// ---------------------------------------------------------------------------

describe("Accessibility: aria-pressed reflects currentColor on swatch buttons", () => {
  it("swatch matching currentColor has aria-pressed=true", () => {
    const blue = TASK_CARD_PALETTE.find((c) => c.id === "blue")!;
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={blue.hexValue}
        onChange={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByLabelText(blue.label)).toHaveAttribute("aria-pressed", "true");
  });

  it("swatch not matching currentColor has aria-pressed=false", () => {
    const blue = TASK_CARD_PALETTE.find((c) => c.id === "blue")!;
    const red = TASK_CARD_PALETTE.find((c) => c.id === "red")!;
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={blue.hexValue}
        onChange={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByLabelText(red.label)).toHaveAttribute("aria-pressed", "false");
  });

  it("all swatches have aria-pressed=false when currentColor is undefined", () => {
    render(
      <ColorPickerPopover
        anchorEl={null}
        currentColor={undefined}
        onChange={() => {}}
        onClose={() => {}}
      />
    );
    const dialog = screen.getByRole("dialog");
    for (const btn of within(dialog).getAllByRole("button")) {
      expect(btn).toHaveAttribute("aria-pressed", "false");
    }
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation: arrow keys within ColorPickerPopover
// ---------------------------------------------------------------------------

describe("ColorPickerPopover: arrow key navigation between swatches", () => {
  it("ArrowRight moves focus from first swatch to second", () => {
    render(
      <ColorPickerPopover anchorEl={null} currentColor={undefined} onChange={() => {}} onClose={() => {}} />
    );
    const buttons = within(screen.getByRole("dialog")).getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("ArrowRight from the last swatch wraps to the first", () => {
    render(
      <ColorPickerPopover anchorEl={null} currentColor={undefined} onChange={() => {}} onClose={() => {}} />
    );
    const buttons = within(screen.getByRole("dialog")).getAllByRole("button");
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("ArrowLeft from the first swatch wraps to the last", () => {
    render(
      <ColorPickerPopover anchorEl={null} currentColor={undefined} onChange={() => {}} onClose={() => {}} />
    );
    const buttons = within(screen.getByRole("dialog")).getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it("ArrowDown moves focus 4 positions forward (one grid row)", () => {
    render(
      <ColorPickerPopover anchorEl={null} currentColor={undefined} onChange={() => {}} onClose={() => {}} />
    );
    const buttons = within(screen.getByRole("dialog")).getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowDown" });
    // 8 swatches in a 4-col grid: row 0 = [0..3], row 1 = [4..7]
    expect(document.activeElement).toBe(buttons[4]);
  });

  it("ArrowUp from the top row stays clamped at index 0", () => {
    render(
      <ColorPickerPopover anchorEl={null} currentColor={undefined} onChange={() => {}} onClose={() => {}} />
    );
    const buttons = within(screen.getByRole("dialog")).getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(buttons[0]);
  });
});

// ---------------------------------------------------------------------------
// Integration: swatch selection in the full TaskCard context
// ---------------------------------------------------------------------------

describe("Integration: swatch selection propagates through TaskCard", () => {
  it("clicking a swatch calls onColorChange with the swatch hex value", () => {
    const onColorChange = vi.fn();
    render(<TaskCard task={makeTask()} onColorChange={onColorChange} />);
    fireEvent.click(screen.getByLabelText("Pick card color"));
    const red = TASK_CARD_PALETTE.find((c) => c.id === "red")!;
    fireEvent.click(screen.getByLabelText(red.label));
    expect(onColorChange).toHaveBeenCalledWith(red.hexValue);
  });

  it("popover is removed from the DOM after a swatch is selected", () => {
    render(<TaskCard task={makeTask()} onColorChange={() => {}} />);
    fireEvent.click(screen.getByLabelText("Pick card color"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(TASK_CARD_PALETTE[0].label));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("palette button is present even when onColorChange prop is omitted", () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.getByLabelText("Pick card color")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: default/white swatch resets to the neutral hex value
// ---------------------------------------------------------------------------

describe("Edge: default (white) swatch emits the correct hex value", () => {
  it("clicking the Default swatch calls onChange with #ffffff", () => {
    const onChange = vi.fn();
    render(
      <ColorPickerPopover anchorEl={null} currentColor={undefined} onChange={onChange} onClose={() => {}} />
    );
    const white = TASK_CARD_PALETTE.find((c) => c.id === "white")!;
    fireEvent.click(screen.getByLabelText(white.label));
    expect(onChange).toHaveBeenCalledWith("#ffffff");
  });
});

// ---------------------------------------------------------------------------
// Edge: multiple cards carry independent, localStorage-keyed colors
// ---------------------------------------------------------------------------

describe("Edge: multiple task cards have independent colors", () => {
  it("two tasks with different stored colors have different inline backgrounds", () => {
    localStorage.setItem("task-color:1", "#FCA5A5");
    localStorage.setItem("task-color:2", "#93C5FD");
    const { container } = render(<TasksPage />);
    const articles = container.querySelectorAll("article");
    const first = (articles[0] as HTMLElement).style.backgroundColor;
    const second = (articles[1] as HTMLElement).style.backgroundColor;
    expect(first).not.toBe("");
    expect(second).not.toBe("");
    expect(first).not.toBe(second);
  });

  it("task with no stored color has no inline backgroundColor while a neighbour does", () => {
    localStorage.setItem("task-color:1", "#FCA5A5");
    // task id=2 has no stored color
    const { container } = render(<TasksPage />);
    const articles = container.querySelectorAll("article");
    expect((articles[0] as HTMLElement).style.backgroundColor).not.toBe("");
    expect((articles[1] as HTMLElement).style.backgroundColor).toBe("");
  });
});
