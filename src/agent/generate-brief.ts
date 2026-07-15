import type { Account, Activity, Brief, Contact, NextStep } from "@/db/schema";
import { getAccount, saveBrief } from "@/data/repository";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { relativeTime } from "@/lib/ui";
import { type BriefOutput } from "./brief-schema";

// One account's full context for brief generation: the account facts, its people, and the
// activity timeline the model has to ground every claim in.
export type AccountContext = { account: Account; contacts: Contact[]; activities: Activity[] };

export function buildPrompt(account: Account, contacts: Contact[], activities: Activity[]): string {
  const people = contacts
    .map((c) => `- ${c.name}, ${c.title} (${c.relationship}, ${c.sentiment})`)
    .join("\n");
  const acts = activities
    .map((a) => `[${a.id}] (${a.kind}, ${relativeTime(a.occurredAt, SEED_ANCHOR)}) ${a.summary}\n${a.body}`)
    .join("\n\n");

  return `You are st-eve, a solutions-engineering copilot. Write this account's weekly brief, grounded ONLY in the activities below — do not invent facts or ids.

ACCOUNT: ${account.name} — ${account.industry}, $${account.arr.toLocaleString()} ARR. CRM stage on record: ${account.stage}. Priority: ${account.priority}.

CONTACTS:
${people}

ACTIVITIES (cite these by their bracketed id):
${acts}

What to produce:
- inferredStage: the stage you actually read from the activities (it may differ from the CRM stage), with a confidence 0-1.
- sfdcSummary: a Salesforce-ready weekly summary — what moved, where it stands, blockers, who's engaged. Cite claims inline as [1], [2]… matching the citations array, in order.
- slackUpdate: a short Slack update for the account channel — stage, a win, the blockers, the next step. Bullets, no fluff.
- nextSteps: up to 5, most important first, each with an owner and the activity ids that justify it.
- citations: every source you used, in [n] order. Every activityId MUST be one of the ids above.`;
}

// Deterministic brief for when there's no gateway — weak (it can't really infer), but it
// keeps the flow working and the demo honest about running without a model.
function fallbackBrief(account: Account, activities: Activity[]): BriefOutput {
  const recent = activities.slice(0, 3);
  return {
    inferredStage: account.stage,
    inferredConfidence: 0.5,
    sfdcSummary: `${account.name} is at the ${account.stage.replace(/_/g, " ")} stage. Recent activity: ${recent
      .map((a) => a.summary)
      .join("; ")}. ${recent.map((_, i) => `[${i + 1}]`).join("")}`,
    slackUpdate: `*${account.name}* — ${account.stage.replace(/_/g, " ")}\n• Next: ${account.nextStep ?? "TBD"}`,
    nextSteps: account.nextStep
      ? [{ priority: account.priority, text: account.nextStep, owner: "You", citations: recent.slice(0, 1).map((a) => a.id) }]
      : [],
    citations: recent.map((a) => ({ label: a.summary, activityId: a.id })),
  };
}

// The grounding check that makes citations trustworthy: drop anything the model pointed at that
// isn't a real activity, and only call it "grounded" if it stayed clean. Shared by the one-shot
// path and the streaming route so both persist an identical, validated brief.
export function finalizeBrief(
  accountId: string,
  output: BriefOutput,
  ctx: AccountContext,
  model: string,
  latencyMs: number,
) {
  const validIds = new Set(ctx.activities.map((a) => a.id));
  const cited = [...output.citations.map((c) => c.activityId), ...output.nextSteps.flatMap((s) => s.citations)];
  const grounded = cited.length > 0 && cited.every((id) => validIds.has(id));
  const citations = output.citations.filter((c) => validIds.has(c.activityId));
  const nextSteps: NextStep[] = output.nextSteps.map((s) => ({
    ...s,
    citations: s.citations.filter((id) => validIds.has(id)),
  }));

  return {
    accountId,
    sfdcSummary: output.sfdcSummary,
    slackUpdate: output.slackUpdate,
    inferredStage: output.inferredStage,
    inferredConfidence: output.inferredConfidence,
    nextSteps,
    citations,
    grounded,
    meta: { model, latencyMs },
  };
}

// Compose + validate the deterministic brief without persisting. The account detail page streams
// the real brief through /api/brief (Sonnet 5); this is the model-free path the button falls back
// to when there's no AI Gateway — weak, but it keeps the flow working and honest about running
// without a model.
export async function composeBrief(accountId: string) {
  const context = await getAccount(accountId);
  if (!context) throw new Error(`unknown account: ${accountId}`);

  const started = Date.now();
  const output = fallbackBrief(context.account, context.activities);
  return finalizeBrief(accountId, output, context, "fallback (no AI Gateway)", Date.now() - started);
}

// Compose + persist — what the button calls when there's no gateway to stream from.
export async function generateBrief(accountId: string): Promise<Brief> {
  return saveBrief(await composeBrief(accountId));
}
