import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui/pill";
import { RunEvalsButton } from "@/components/evals/run-evals-button";
import { getEvalRuns } from "@/data/repository";
import { ACCOUNTS } from "@/lib/seed";
import { STAGE_LABEL, type Stage } from "@/lib/domain";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const timeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const nameOf = (id: string) => ACCOUNTS.find((a) => a.id === id)?.name ?? id;

function Tile({ value, label, sub, tone }: { value: string; label: string; sub: string; tone: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className={`text-3xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold">{label}</div>
      <div className="text-xs text-sub">{sub}</div>
    </div>
  );
}

export default async function EvalsPage() {
  const runs = await getEvalRuns(6);
  const latest = runs[0];
  const failing = latest ? latest.cases.filter((c) => c.predictedStage !== c.actualStage) : [];

  return (
    <AppShell>
      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Evals</h1>
              <p className="text-sm text-sub">
                {latest
                  ? `Latest run · ${timeFmt.format(latest.createdAt)} · ${latest.accountCount} labeled accounts`
                  : "Grade st-eve against the labeled seed — stage accuracy, citation grounding, field completeness."}
              </p>
            </div>
            <RunEvalsButton hasRuns={runs.length > 0} />
          </header>

          {!latest ? (
            <div className="rounded-[var(--radius)] border border-border bg-surface px-4 py-12 text-center text-sm text-sub">
              No eval runs yet — hit Run evals and st-eve grades itself over the whole labeled seed.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Tile
                  value={pct(latest.stageAccuracy)}
                  label="Stage accuracy"
                  sub={`${Math.round(latest.stageAccuracy * latest.accountCount)} / ${latest.accountCount} correct`}
                  tone="text-accent"
                />
                <Tile
                  value={pct(latest.groundingRate)}
                  label="Citation grounding"
                  sub="claims resolve to real activities"
                  tone="text-success"
                />
                <Tile
                  value={pct(latest.completeness)}
                  label="Field completeness"
                  sub="all required brief fields"
                  tone="text-success"
                />
              </div>

              <div
                className={`flex items-center gap-3 rounded-[var(--radius)] p-4 ${
                  latest.status === "pass" ? "bg-success-soft" : "bg-warn-soft"
                }`}
              >
                <Pill tone={latest.status === "pass" ? "success" : "warn"}>
                  {latest.status === "pass" ? "Pass" : "Warn"}
                </Pill>
                <div className={latest.status === "pass" ? "text-success" : "text-warn"}>
                  <div className="text-sm font-semibold">Regression gate</div>
                  <div className="text-xs">thresholds: stage ≥ 85% · grounding ≥ 95%</div>
                </div>
              </div>

              {failing.length > 0 && (
                <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
                  <h2 className="mb-3 text-sm font-semibold">
                    Failing cases · stage misclassification ({failing.length})
                  </h2>
                  <div className="flex flex-col gap-2">
                    {failing.map((c) => (
                      <div key={c.accountId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">{nameOf(c.accountId)}</span>
                        <span className="flex items-center gap-2 text-sub">
                          predicted
                          <Pill tone="warn">{STAGE_LABEL[c.predictedStage as Stage]}</Pill>
                          → actual
                          <Pill tone="success">{STAGE_LABEL[c.actualStage as Stage]}</Pill>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
                <div className="flex items-center gap-4 bg-bg px-4 py-2.5 text-[11px] font-semibold text-sub">
                  <span className="w-16 shrink-0">RUN</span>
                  <span className="flex-1">DATE</span>
                  <span className="w-20 shrink-0">STAGE</span>
                  <span className="w-24 shrink-0">GROUNDING</span>
                  <span className="w-20 shrink-0">COMPLETE</span>
                  <span className="w-16 shrink-0">STATUS</span>
                </div>
                {runs.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-4 border-t border-border px-4 py-3 text-sm">
                    <span className="w-16 shrink-0 font-semibold">#{runs.length - i}</span>
                    <span className="flex-1 text-sub">{timeFmt.format(r.createdAt)}</span>
                    <span className="w-20 shrink-0">{pct(r.stageAccuracy)}</span>
                    <span className="w-24 shrink-0">{pct(r.groundingRate)}</span>
                    <span className="w-20 shrink-0">{pct(r.completeness)}</span>
                    <span className="w-16 shrink-0">
                      <Pill tone={r.status === "pass" ? "success" : "warn"}>
                        {r.status === "pass" ? "Pass" : "Warn"}
                      </Pill>
                    </span>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>

        <aside className="flex w-72 shrink-0 flex-col gap-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">WHAT WE MEASURE</p>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <div className="font-semibold">Stage accuracy</div>
                <p className="text-xs text-sub">Inferred opportunity stage vs the labeled ground truth.</p>
              </div>
              <div>
                <div className="font-semibold">Citation grounding</div>
                <p className="text-xs text-sub">
                  Every claim must map to a real activity id — ungrounded claims fail. This is the
                  hallucination regression check.
                </p>
              </div>
              <div>
                <div className="font-semibold">Field completeness</div>
                <p className="text-xs text-sub">The Salesforce summary, Slack update, and next steps all came back.</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">MODEL ROUTING</p>
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-bg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-sub">Generation</span>
                <span className="font-semibold">Claude Sonnet 5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sub">Router</span>
                <span className="font-semibold">AI Gateway</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
