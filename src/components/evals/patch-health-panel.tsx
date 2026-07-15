"use client";

import { useState, useTransition } from "react";
import { Pill } from "@/components/ui/pill";
import { runPatchHealthAction } from "@/app/actions";
import type { PatchHealth } from "@/agent/eval";

export function PatchHealthPanel() {
  const [result, setResult] = useState<PatchHealth | null>(null);
  const [pending, start] = useTransition();

  function run() {
    start(async () => setResult(await runPatchHealthAction()));
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={run}
        disabled={pending}
        className="self-start rounded-[var(--radius)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
      >
        {pending ? "Checking the patch…" : result ? "Re-run health check" : "Run patch health"}
      </button>

      {!result && !pending && (
        <div className="rounded-[var(--radius)] border border-border bg-surface px-4 py-12 text-center text-sm text-sub">
          Hit run — st·eve checks every opportunity for gaps and reads each one for momentum in a couple seconds.
        </div>
      )}

      {result && (
        <>
          <section className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
            <div className="bg-bg px-4 py-2 text-[11px] font-semibold text-sub">COVERAGE — nothing falls through the cracks</div>
            {result.checks.map((c) => {
              const clean = c.pass === c.total;
              return (
                <div key={c.label} className="flex items-start gap-3 border-t border-border px-4 py-3">
                  <Pill tone={clean ? "success" : "warn"}>
                    {c.pass}/{c.total}
                  </Pill>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.label}</div>
                    {!clean && <div className="mt-0.5 text-xs text-warn">missing on: {c.gaps.join(", ")}</div>}
                  </div>
                  <span className={`text-lg leading-none ${clean ? "text-success" : "text-warn"}`}>{clean ? "✓" : "!"}</span>
                </div>
              );
            })}
          </section>

          <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold">
              Momentum read <span className="font-normal text-xs text-sub">· {result.model}</span>
            </h2>
            {result.momentum.length === 0 ? (
              <p className="mt-2 text-sm text-sub">Nothing flagged — every account reads like it&apos;s moving.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {result.momentum.map((m) => (
                  <div key={m.account} className="flex flex-wrap items-center gap-2 text-sm">
                    <Pill tone={m.momentum === "at_risk" ? "danger" : "warn"}>
                      {m.momentum === "at_risk" ? "At risk" : "Stalled"}
                    </Pill>
                    <span className="font-semibold">{m.account}</span>
                    {m.note && <span className="text-sub">— {m.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
