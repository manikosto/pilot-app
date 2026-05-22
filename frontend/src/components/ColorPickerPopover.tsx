"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TASK_CARD_PALETTE } from "@/lib/constants/taskCardPalette";

interface Props {
  anchorEl?: HTMLElement | null;
  currentColor?: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export function ColorPickerPopover({ anchorEl, currentColor, onChange, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on outside mousedown; exclude clicks on the anchor (trigger button).
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        if (!anchorEl || !anchorEl.contains(target)) {
          onClose();
        }
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [anchorEl, onClose]);

  // Close on Escape.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  const rect = anchorEl?.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: "fixed",
    top: (rect?.bottom ?? 0) + 4,
    left: rect?.left ?? 8,
    zIndex: 9999,
  };

  function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (!buttons) return;
    const arr = Array.from(buttons);
    const idx = arr.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      arr[(idx + 1) % arr.length].focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      arr[(idx - 1 + arr.length) % arr.length].focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      arr[Math.min(idx + 4, arr.length - 1)].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      arr[Math.max(idx - 4, 0)].focus();
    }
  }

  return createPortal(
    <div
      ref={containerRef}
      style={style}
      role="dialog"
      aria-label="Pick a card color"
      className="rounded-lg border border-zinc-200 bg-white p-2 shadow-lg"
    >
      <div className="grid grid-cols-4 gap-1" onKeyDown={handleGridKeyDown}>
        {TASK_CARD_PALETTE.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-label={color.label}
            aria-pressed={currentColor === color.hexValue}
            style={{ backgroundColor: color.hexValue }}
            className="size-7 rounded-md border border-zinc-300 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
            onClick={() => {
              onChange(color.hexValue);
              onClose();
            }}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
