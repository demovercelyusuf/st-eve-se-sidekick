"use client";

import { useObject } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pill } from "@/components/ui/pill";
import { priorityBadge, stageBadge } from "@/lib/ui";
import { briefSchema } from "@/agent/brief-schema";
import { generateBriefAction } from "@/app/actions";
import { BriefView } from "./brief-view";
import type { Brief } from "@/db/schema";
import type { Priority, Stage } from "@/lib/domain";

export function AccountBrief({
  accountId,
  gatewayReady,
  initialBrief,
}: {
  accountId: string;
  gatewayReady: boolean;
  initialBrief: Brief | null;
}) {
  const router = useRouter();
  const { object, submit, isLoading, error } = useObject({
    api: "/api/brief",
    schema: briefSchema,
    onFinish: () => router.refresh(), // reload the persisted, validated brief + its actions
  });
  const [fallbackPending, startFallback] = useTransition();
  const busy = isLoading || fallbackPending;

  function generate() {
    if (gatewayReady) submit({ accountId });
    else startFallback(async () => {
      await generateBriefAction(accountId);
      router.refresh();
    });
  }

  // Show the live stream while it's coming in (and until the persisted version lands on a first
  // generate). Otherwise show the saved brief.
  const showStream = object && (isLoading || !initialBrief);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-opacity disabled:opacity-60"
        >
          {busy ? "st·eve is writing…" : initialBrief ? "Regenerate brief" : "Generate brief"}
        </button>
        {error && <span className="text-xs text-danger">Couldn&apos;t generate — {error.message}. Try again.</span>}
      </div>

      {showStream ? (
        <StreamingBrief object={object} live={isLoading} />
      ) : initialBrief ? (
        <BriefView brief={initialBrief} accountId={accountId} />
      ) : null}
    </div>
  );
}

// The brief as it streams — a lighter view than the saved one (no grounded badge or actions yet;
// those come from the persisted version once the stream closes).
function StreamingBrief({ object, live }: { object: Record<string, unknown>; live: boolean }) {
  const o = object as Partial<{
    inferredStage: Stage;
    inferredConfidence: number;
    sfdcSummary: string;
    slackUpdate: string;
    nextSteps: Array<Partial<{ priority: Priority; text: string; owner: string; due: string }>>;
  }>;
  const stage = o.inferredStage ? stageBadge(o.inferredStage) : null;

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-5">
      <header className="flex items-center gap-2">
        <div className="text-[11px] font-semibold text-sub">WEEKLY BRIEF</div>
        {stage && <Pill tone={stage.tone}>{stage.label}</Pill>}
        {typeof o.inferredConfidence === "number" && (
          <span className="text-xs text-sub">inferred · {Math.round(o.inferredConfidence * 100)}%</span>
        )}
        {live && <span className="ml-auto text-xs text-accent">st·eve is writing▍</span>}
      </header>

      {o.sfdcSummary && (
        <div>
          <div className="mb-1 text-sm font-semibold">Salesforce-ready summary</div>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{o.sfdcSummary}</p>
        </div>
      )}

      {o.slackUpdate && (
        <div>
          <div className="mb-1 text-sm font-semibold">Slack update</div>
          <div className="whitespace-pre-wrap rounded-[var(--radius)] border border-border bg-bg p-3 text-[13px] leading-relaxed">
            {o.slackUpdate}
          </div>
        </div>
      )}

      {o.nextSteps && o.nextSteps.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Prioritized next steps</div>
          <ol className="flex flex-col gap-2">
            {o.nextSteps.map((s, i) =>
              s?.text ? (
                <li key={i} className="flex items-start gap-2">
                  {s.priority && <Pill tone={priorityBadge(s.priority).tone}>{priorityBadge(s.priority).label}</Pill>}
                  <div className="text-[13px]">
                    {s.text}
                    {s.owner && <span className="text-sub"> — {s.owner}</span>}
                  </div>
                </li>
              ) : null,
            )}
          </ol>
        </div>
      )}
    </section>
  );
}
