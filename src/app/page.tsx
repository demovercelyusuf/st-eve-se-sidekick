import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui/pill";
import { getPatch } from "@/data/repository";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import type { Priority, Stage } from "@/lib/domain";
import { formatArr, priorityBadge, relativeTime, stageBadge } from "@/lib/ui";

// The Command Center is the home screen — your whole patch, sorted so the accounts that
// need you are at the top. It's a server component: the patch is read on the server and
// streamed down, no client fetch.
const DEFAULT_PERSONA = "you";

function Tile({ n, label, tone }: { n: number; label: string; tone?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className={`text-2xl font-bold ${tone ?? "text-ink"}`}>{n}</div>
      <div className="text-xs text-sub">{label}</div>
    </div>
  );
}

export default function Page() {
  const { accounts, kpis } = getPatch(DEFAULT_PERSONA);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-xl font-bold">Your patch</h1>
          <p className="text-sm text-sub">
            {kpis.accounts} accounts across 2 AM patches · sorted by priority
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile n={kpis.accounts} label="Accounts" />
          <Tile n={kpis.atRisk} label="At risk" tone="text-danger" />
          <Tile n={kpis.awaiting} label="Awaiting next step" tone="text-warn" />
          <Tile n={kpis.wins} label="Technical wins" tone="text-success" />
        </div>

        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
          <div className="flex items-center gap-4 bg-bg px-4 py-2.5 text-[11px] font-semibold text-sub">
            <span className="w-56 shrink-0">ACCOUNT</span>
            <span className="w-40 shrink-0">STAGE</span>
            <span className="w-24 shrink-0">PRIORITY</span>
            <span className="flex-1">NEXT STEP</span>
          </div>

          {accounts.map((a) => {
            const stage = stageBadge(a.stage as Stage);
            const priority = priorityBadge(a.priority as Priority);
            return (
              <Link
                key={a.id}
                href={`/accounts/${a.id}`}
                className="flex items-center gap-4 border-t border-border px-4 py-3 transition-colors hover:bg-accent-soft/40"
              >
                <div className="w-56 shrink-0">
                  <div className="truncate text-sm font-semibold">{a.name}</div>
                  <div className="truncate text-xs text-sub">
                    {a.industry} · {formatArr(a.arr)}
                  </div>
                </div>
                <div className="w-40 shrink-0">
                  <Pill tone={stage.tone}>{stage.label}</Pill>
                </div>
                <div className="w-24 shrink-0">
                  <Pill tone={priority.tone}>{priority.label}</Pill>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{a.nextStep ?? "No next step yet"}</div>
                  <div className="text-xs text-sub">{relativeTime(a.lastTouch, SEED_ANCHOR)}</div>
                </div>
                <span className="shrink-0 text-sub" aria-hidden>
                  ›
                </span>
              </Link>
            );
          })}

          {accounts.length === 0 && (
            <div className="border-t border-border px-4 py-10 text-center text-sm text-sub">
              No accounts in this patch yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
