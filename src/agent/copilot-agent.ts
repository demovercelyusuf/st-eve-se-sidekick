import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { getAccount, getPatch } from "@/data/repository";
import { relativeTime } from "@/lib/ui";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { type AccountContext } from "./generate-brief";
import { COPILOT_MODEL } from "./models";

// Shape one account's context into plain, JSON-safe fields for the model. Critically, NO Date
// objects: handing a raw row's Date (`lastTouch` / `occurredAt`) back into the tool loop trips
// serialization and kills the stream. Timestamps become the same relative labels the UI shows.
export function accountContextView(ctx: AccountContext) {
  const a = ctx.account;
  return {
    account: {
      id: a.id,
      name: a.name,
      industry: a.industry,
      arr: a.arr,
      stage: a.stage,
      priority: a.priority,
      atRisk: a.atRisk,
      nextStep: a.nextStep,
      closeTarget: a.closeTarget,
      amName: a.amName,
      lastTouch: relativeTime(a.lastTouch, SEED_ANCHOR),
    },
    contacts: ctx.contacts.map((c) => ({
      name: c.name,
      title: c.title,
      relationship: c.relationship,
      sentiment: c.sentiment,
    })),
    activities: ctx.activities.map((act) => ({
      id: act.id,
      kind: act.kind,
      when: relativeTime(act.occurredAt, SEED_ANCHOR),
      summary: act.summary,
      body: act.body,
    })),
  };
}

/*
 * The conversational side of st-eve. Same brain, different surface: instead of one-shot
 * brief generation, it decides which tools to pull and reasons over a whole patch. The
 * tools only read the repository, so every answer is grounded in real account data — the
 * agent can't make up an account or an activity, it has to fetch it.
 */
export const copilotAgent = new ToolLoopAgent({
  model: COPILOT_MODEL,
  instructions: [
    "You are st-eve, a solutions-engineering copilot for a Vercel SE.",
    "Answer questions about the SE's account patch. ALWAYS ground answers in real data by calling the tools first — never guess account names, stages, or activity details.",
    "When you cite something specific, name the activity it came from. Be concise and practical, the way a busy SE actually talks.",
  ].join(" "),
  tools: {
    list_patch: tool({
      description: "List the accounts in the SE's patch with stage, priority, at-risk flag, and next step. Use this to find or compare accounts.",
      inputSchema: z.object({ personaId: z.string().optional() }),
      execute: async ({ personaId }) =>
        (await getPatch(personaId ?? "you")).accounts.map((a) => ({
          id: a.id,
          name: a.name,
          industry: a.industry,
          arr: a.arr,
          stage: a.stage,
          priority: a.priority,
          atRisk: a.atRisk,
          nextStep: a.nextStep,
        })),
    }),
    get_account_context: tool({
      description: "Get one account's full context: facts, contacts, and the activity timeline. Use before answering anything specific about an account.",
      inputSchema: z.object({ accountId: z.string() }),
      execute: async ({ accountId }) => {
        const ctx = await getAccount(accountId);
        if (!ctx) return { error: `no account with id "${accountId}"` };
        return accountContextView(ctx);
      },
    }),
  },
});
