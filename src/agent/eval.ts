import { generateText, Output } from "ai";
import { z } from "zod";
import { ACCOUNTS } from "@/lib/seed";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { getSeedAccount } from "@/data/repository";
import { CLASSIFY_MODEL, gatewayReady } from "./models";
import type { Account } from "@/db/schema";

/*
 * "Patch Health" — the demo-able eval. Two plain checks a manager immediately gets:
 *
 *  1) Coverage: does every opportunity have the basics that keep it from rotting — a stage, a
 *     next step, a champion, a close target, and a recent touch? Pure data check, instant, and
 *     it names the gaps so you can go fix them.
 *  2) Momentum: st-eve reads each account's recent activity with the CHEAP model (Haiku 4.5, via
 *     the AI Gateway) and flags the ones that are quietly stalling or at risk — the deals that
 *     look fine by date but read stuck. This is where the tiered-model routing actually earns
 *     its keep: fast/cheap for classification, Sonnet 5 reserved for the writing.
 *
 * It runs against the in-repo seed (the pinned truth), so it's deterministic and always demoable.
 */

const STALE_DAYS = 21;

export type HealthCheck = { label: string; pass: number; total: number; gaps: string[] };
export type MomentumFlag = { account: string; momentum: "stalled" | "at_risk"; note: string };
export type PatchHealth = { checks: HealthCheck[]; momentum: MomentumFlag[]; model: string };

const momentumSchema = z.object({
  momentum: z.enum(["progressing", "stalled", "at_risk"]),
  note: z.string().describe("at most 8 words on why"),
});

function daysSince(d: Date): number {
  return Math.round((SEED_ANCHOR.getTime() - d.getTime()) / 86_400_000);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export async function runPatchHealth(): Promise<PatchHealth> {
  const accounts = ACCOUNTS;

  const check = (label: string, ok: (a: Account) => boolean): HealthCheck => {
    const gaps = accounts.filter((a) => !ok(a)).map((a) => a.name);
    return { label, pass: accounts.length - gaps.length, total: accounts.length, gaps };
  };

  const hasChampion = (a: Account) =>
    getSeedAccount(a.id)?.contacts.some((c) => c.relationship === "champion") ?? false;

  const checks: HealthCheck[] = [
    check("Every opportunity has a stage", (a) => Boolean(a.stage)),
    check("Every opportunity has a next step", (a) => Boolean(a.nextStep)),
    check("Every opportunity has a champion", hasChampion),
    check("Every opportunity has a close target", (a) => Boolean(a.closeTarget)),
    check(`No opportunity dark for ${STALE_DAYS}+ days`, (a) => daysSince(a.lastTouch) <= STALE_DAYS),
  ];

  // Momentum read — the cheap model, one call per account, only the concerning ones surface.
  let momentum: MomentumFlag[] = [];
  let model = "coverage only — connect AI Gateway for the momentum read";
  if (gatewayReady) {
    model = CLASSIFY_MODEL;
    const reads = await mapLimit(accounts, 6, async (a) => {
      const recent = (getSeedAccount(a.id)?.activities ?? [])
        .slice(0, 3)
        .map((x) => `- ${x.summary}: ${x.body}`)
        .join("\n");
      try {
        const { output } = await generateText({
          model: CLASSIFY_MODEL,
          output: Output.object({ schema: momentumSchema }),
          prompt: `You classify the momentum of a Vercel sales opportunity from its most recent activity.
- progressing: clearly moving forward
- stalled: gone quiet, waiting, or blocked without urgency
- at_risk: actively slipping — a hard blocker, a skeptic with power, or a deadline about to lapse

Account: ${a.name} (stage: ${a.stage}). Recent activity:
${recent}`,
        });
        return { account: a.name, momentum: output.momentum, note: output.note };
      } catch {
        return { account: a.name, momentum: "progressing" as const, note: "" };
      }
    });
    momentum = reads.filter((r): r is MomentumFlag => r.momentum !== "progressing");
  }

  return { checks, momentum, model };
}
