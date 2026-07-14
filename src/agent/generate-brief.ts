import { generateText, Output } from "ai";
import type { Account, Activity, Brief, Contact, NextStep } from "@/db/schema";
import { getAccount, saveBrief } from "@/data/repository";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { relativeTime } from "@/lib/ui";
import { briefSchema, type BriefOutput } from "./brief-schema";
import { GENERATION_MODEL, gatewayReady } from "./models";

function buildPrompt(account: Account, contacts: Contact[], activities: Activity[]): string {
  const people = contacts
    .map((c) => `- ${c.name}, ${c.title} (${c.relationship}, ${c.sentiment})`)
    .join("\n");
  const acts = activities
    .map(
      (a) =>
        `[${a.id}] (${a.kind}, ${relativeTime(a.occurredAt, SEED_ANCHOR)}) ${a.summary}\n${a.body}`,
    )
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

export async function generateBrief(accountId: string): Promise<Brief> {
  const ctx = getAccount(accountId);
  if (!ctx) throw new Error(`unknown account: ${accountId}`);
  const { account, contacts, activities } = ctx;
  const validIds = new Set(activities.map((a) => a.id));

  const started = Date.now();
  let output: BriefOutput;
  let model: string;
  let tokens = 0;

  if (gatewayReady) {
    const res = await generateText({
      model: GENERATION_MODEL,
      output: Output.object({ schema: briefSchema }),
      prompt: buildPrompt(account, contacts, activities),
    });
    output = res.output;
    model = GENERATION_MODEL;
    tokens = res.usage?.totalTokens ?? 0;
  } else {
    output = fallbackBrief(account, activities);
    model = "fallback (no AI Gateway)";
  }

  // The grounding check that makes the citations trustworthy: drop anything the model
  // pointed at that isn't a real activity, and only call it "grounded" if it stayed clean.
  const cited = [...output.citations.map((c) => c.activityId), ...output.nextSteps.flatMap((s) => s.citations)];
  const grounded = cited.length > 0 && cited.every((id) => validIds.has(id));
  const citations = output.citations.filter((c) => validIds.has(c.activityId));
  const nextSteps: NextStep[] = output.nextSteps.map((s) => ({
    ...s,
    citations: s.citations.filter((id) => validIds.has(id)),
  }));

  return saveBrief({
    accountId,
    sfdcSummary: output.sfdcSummary,
    slackUpdate: output.slackUpdate,
    inferredStage: output.inferredStage,
    inferredConfidence: output.inferredConfidence,
    nextSteps,
    citations,
    grounded,
    meta: { model, latencyMs: Date.now() - started, tokens },
  });
}
