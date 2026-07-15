import { streamObject } from "ai";
import { getAccount, saveBrief } from "@/data/repository";
import { briefSchema } from "@/agent/brief-schema";
import { buildPrompt, finalizeBrief } from "@/agent/generate-brief";
import { GENERATION_MODEL } from "@/agent/models";

// Streams the brief object as Sonnet 5 writes it, so the account page fills in live. When the
// object is complete we run the same grounding validation as the one-shot path and persist it —
// the client refreshes to the saved, validated brief (with the grounded badge + Salesforce/Slack
// actions) once the stream closes.
export async function POST(req: Request) {
  const { accountId } = (await req.json()) as { accountId?: string };
  if (!accountId) return new Response("accountId required", { status: 400 });

  const ctx = await getAccount(accountId);
  if (!ctx) return new Response("unknown account", { status: 404 });

  const started = Date.now();
  const result = streamObject({
    model: GENERATION_MODEL,
    schema: briefSchema,
    prompt: buildPrompt(ctx.account, ctx.contacts, ctx.activities),
    onFinish: async ({ object }) => {
      if (!object) return; // model produced nothing schema-valid — leave the old brief in place
      await saveBrief(finalizeBrief(accountId, object, ctx, GENERATION_MODEL, Date.now() - started));
    },
  });

  return result.toTextStreamResponse();
}
