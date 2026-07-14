import { ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { getAccount, getPatch } from "@/data/repository";
import { GENERATION_MODEL } from "./models";

/*
 * The conversational side of st-eve. Same brain, different surface: instead of one-shot
 * brief generation, it decides which tools to pull and reasons over a whole patch. The
 * tools only read the repository, so every answer is grounded in real account data — the
 * agent can't make up an account or an activity, it has to fetch it.
 */
export const copilotAgent = new ToolLoopAgent({
  model: GENERATION_MODEL,
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
        getPatch(personaId ?? "you").accounts.map((a) => ({
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
        const ctx = getAccount(accountId);
        if (!ctx) return { error: `no account with id "${accountId}"` };
        return {
          account: ctx.account,
          contacts: ctx.contacts,
          activities: ctx.activities.map((a) => ({
            id: a.id,
            kind: a.kind,
            summary: a.summary,
            body: a.body,
          })),
        };
      },
    }),
  },
});
