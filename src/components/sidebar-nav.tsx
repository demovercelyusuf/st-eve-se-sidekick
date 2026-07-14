"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Command Center" },
  { href: "/copilot", label: "st·eve Copilot" },
  { href: "/evals", label: "Evals" },
  { href: "/accounts", label: "Accounts" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        // keep "/" exact; everything else matches its subtree, so /accounts/acme still lights up Accounts
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[var(--radius)] px-2.5 py-2 text-sm transition-colors ${
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
