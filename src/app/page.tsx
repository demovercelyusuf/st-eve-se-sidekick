import { AppShell } from "@/components/app-shell";

// Placeholder for now — mostly here to prove the theming holds up end to end.
// The KPIs and the account list get wired to the seeded Neon data next.
const KPIS = [
  { n: "18", label: "Accounts" },
  { n: "3", label: "At risk", tone: "text-danger" },
  { n: "5", label: "Awaiting next step", tone: "text-warn" },
  { n: "4", label: "Technical wins", tone: "text-success" },
];

export default function Page() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold">Your patch</h1>
          <p className="text-sm text-sub">18 accounts across 2 AM patches · sorted by priority</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <div className={`text-2xl font-bold ${kpi.tone ?? "text-ink"}`}>{kpi.n}</div>
              <div className="text-xs text-sub">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm text-sub">
          The prioritized account list wires to seeded Neon data next. Try the swatches
          top-right — every surface re-skins across all four themes with no reload.
        </div>
      </div>
    </AppShell>
  );
}
