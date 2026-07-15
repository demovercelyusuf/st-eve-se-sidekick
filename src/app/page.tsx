import { AppShell } from "@/components/app-shell";
import { PatchTable, type PatchRowData } from "@/components/command/patch-table";
import { getPatch } from "@/data/repository";
import { hasDb } from "@/db/client";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { relativeTime } from "@/lib/ui";
import type { Priority, Stage } from "@/lib/domain";

// The Command Center is the home screen — your whole patch, sorted so the accounts that
// need you are at the top. It's a server component: the patch is read on the server and
// streamed down; the table itself is a client island so priority/next-step edit inline.
const DEFAULT_PERSONA = "you";

function Tile({ n, label, tone }: { n: number; label: string; tone?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className={`text-2xl font-bold ${tone ?? "text-ink"}`}>{n}</div>
      <div className="text-xs text-sub">{label}</div>
    </div>
  );
}

export default async function Page() {
  const { accounts, kpis } = await getPatch(DEFAULT_PERSONA);

  // Pre-format lastTouch here so the client island doesn't need to import the seed anchor.
  const rows: PatchRowData[] = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    industry: a.industry,
    arr: a.arr,
    stage: a.stage as Stage,
    priority: a.priority as Priority,
    nextStep: a.nextStep,
    touchLabel: relativeTime(a.lastTouch, SEED_ANCHOR),
  }));

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

        <PatchTable initial={rows} canEdit={hasDb} />
      </div>
    </AppShell>
  );
}
