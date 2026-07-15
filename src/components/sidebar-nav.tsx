"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Command Center" },
  { href: "/board", label: "Board" },
  { href: "/copilot", label: "st·eve Copilot" },
  { href: "/evals", label: "Evals" },
  { href: "/integrations", label: "Integrations" },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        // Command Center matches exactly (it's just /app); every other item matches its subtree.
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`rounded-[var(--radius)] px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-accent-soft font-semibold text-accent"
                : "text-ink hover:bg-accent-soft/60"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
