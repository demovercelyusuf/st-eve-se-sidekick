import type { EvalRun } from "@/db/schema";
import { ACCOUNTS } from "@/lib/seed";
import { getSeedAccount, saveEvalRun } from "@/data/repository";
import { composeBrief } from "./generate-brief";
import { GENERATION_MODEL, gatewayReady } from "./models";

// The bar a run has to clear to count as green. Stage accuracy and grounding are the ones
// that actually matter; completeness is table stakes.
const STAGE_THRESHOLD = 0.85;
const GROUNDING_THRESHOLD = 0.95;

// small concurrency limiter so a run doesn't fire 24 model calls at once
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/*
 * Run st-eve over every labeled account and grade it:
 *  - stage accuracy: did the inferred stage match the labeled one?
 *  - grounding: did every claim resolve to a real activity (the hallucination check)?
 *  - completeness: did we get all the required brief fields?
 * Uses composeBrief (no persistence) so a scoring run doesn't litter the brief store.
 */
export async function runEvals(): Promise<EvalRun> {
  const accounts = ACCOUNTS;

  const cases = await mapLimit(accounts, 6, async (a) => {
    // Grade against the pinned seed context, not the live (editable) DB account.
    const brief = await composeBrief(a.id, getSeedAccount(a.id) ?? undefined);
    return {
      accountId: a.id,
      predictedStage: brief.inferredStage,
      actualStage: a.stage,
      grounded: brief.grounded,
      complete: Boolean(brief.sfdcSummary && brief.slackUpdate && brief.nextSteps.length > 0),
    };
  });

  const n = cases.length || 1;
  const stageAccuracy = cases.filter((c) => c.predictedStage === c.actualStage).length / n;
  const groundingRate = cases.filter((c) => c.grounded).length / n;
  const completeness = cases.filter((c) => c.complete).length / n;
  const status = stageAccuracy >= STAGE_THRESHOLD && groundingRate >= GROUNDING_THRESHOLD ? "pass" : "warn";

  return saveEvalRun({
    accountCount: cases.length,
    stageAccuracy,
    groundingRate,
    completeness,
    status,
    model: gatewayReady ? GENERATION_MODEL : "fallback (no AI Gateway)",
    cases,
  });
}
