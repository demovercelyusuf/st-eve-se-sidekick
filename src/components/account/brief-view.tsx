import type { Brief } from "@/db/schema";
import type { Priority, Stage } from "@/lib/domain";
import { Pill } from "@/components/ui/pill";
import { priorityBadge, stageBadge } from "@/lib/ui";
import { BriefActions } from "./brief-actions";

// The payoff: what st-eve produced from the timeline. Stage it inferred (+ how sure it is
// and whether every claim was grounded), the Salesforce summary, the Slack update, the
// prioritized next steps, and the sources behind it.
export function BriefView({ brief, accountId }: { brief: Brief; accountId: string }) {
  const stage = stageBadge(brief.inferredStage as Stage);

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-sub">WEEKLY BRIEF</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Pill tone={stage.tone}>{stage.label}</Pill>
            <span className="text-xs text-sub">
              inferred · {Math.round(brief.inferredConfidence * 100)}% confidence
            </span>
            <span className={`text-xs font-medium ${brief.grounded ? "text-success" : "text-warn"}`}>
              {brief.grounded ? "grounded" : "needs review"}
            </span>
          </div>
        </div>
        {brief.meta && (
          <div className="text-right text-xs text-sub">
            {brief.meta.model}
            {brief.meta.latencyMs ? ` · ${(brief.meta.latencyMs / 1000).toFixed(1)}s` : ""}
          </div>
        )}
      </header>

      <div>
        <div className="mb-1 text-sm font-semibold">Salesforce-ready summary</div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{brief.sfdcSummary}</p>
      </div>

      <div>
        <div className="mb-1 text-sm font-semibold">Slack update</div>
        <div className="whitespace-pre-wrap rounded-[var(--radius)] border border-border bg-bg p-3 text-[13px] leading-relaxed">
          {brief.slackUpdate}
        </div>
      </div>

      {brief.nextSteps.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Prioritized next steps</div>
          <ol className="flex flex-col gap-2">
            {brief.nextSteps.map((s, i) => {
              const p = priorityBadge(s.priority as Priority);
              return (
                <li key={i} className="flex items-start gap-2">
                  <Pill tone={p.tone}>{p.label}</Pill>
                  <div className="text-[13px]">
                    {s.text}
                    <span className="text-sub">
                      {" "}
                      — {s.owner}
                      {s.due ? ` · ${s.due}` : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {brief.citations.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-sub">
            GROUNDED IN {brief.citations.length} SOURCE{brief.citations.length === 1 ? "" : "S"}
          </div>
          <div className="flex flex-col gap-0.5">
            {brief.citations.map((c, i) => (
              <div key={i} className="text-xs text-sub">
                [{i + 1}] {c.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <BriefActions accountId={accountId} />
    </section>
  );
}
