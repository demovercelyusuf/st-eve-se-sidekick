import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="text-5xl font-bold">404</div>
        <p className="text-sm text-sub">That account isn&apos;t in your patch.</p>
        <Link
          href="/app"
          className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg"
        >
          Back to your patch
        </Link>
      </div>
    </AppShell>
  );
}
