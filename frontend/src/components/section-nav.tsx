"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

const ITEMS: NavItem[] = [
  {
    href: "/app",
    label: "Notes",
    // Active for exactly /app — NOT /app/tasks etc.
    match: (p) => p === "/app",
  },
  {
    href: "/app/tasks",
    label: "Tasks",
    match: (p) => p === "/app/tasks" || p.startsWith("/app/tasks/"),
  },
];

export function SectionNav() {
  const pathname = usePathname() || "/app";
  return (
    <nav className="-mb-px flex items-center gap-1" aria-label="Workspace sections">
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center px-3 py-2.5 text-[13px] font-medium transition-colors ${
              active
                ? "text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {item.label}
            <span
              className={`absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-colors ${
                active ? "bg-zinc-900" : "bg-transparent"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
