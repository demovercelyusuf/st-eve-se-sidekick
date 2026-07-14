// `pnpm eval` — runs the eval harness and prints a scorecard. Exits non-zero when the gate
// isn't green, so it can gate a deploy in CI.
import { runEvals } from "@/agent/eval";

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

async function main() {
  const run = await runEvals();

  console.log(`\nst-eve eval — ${run.accountCount} accounts · ${run.model}`);
  console.log(`  stage accuracy      ${pct(run.stageAccuracy)}`);
  console.log(`  citation grounding  ${pct(run.groundingRate)}`);
  console.log(`  field completeness  ${pct(run.completeness)}`);
  console.log(`  gate                ${run.status.toUpperCase()}\n`);

  const fails = run.cases.filter((c) => c.predictedStage !== c.actualStage);
  if (fails.length) {
    console.log("stage misses:");
    for (const c of fails) {
      console.log(`  ${c.accountId}: predicted ${c.predictedStage} → actual ${c.actualStage}`);
    }
    console.log("");
  }

  process.exit(run.status === "pass" ? 0 : 1);
}

main();
