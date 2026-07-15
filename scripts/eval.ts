// `pnpm eval` — runs the patch-health check and prints it. Exits non-zero if any coverage check
// has a gap, so it can gate a deploy in CI.
import { runPatchHealth } from "@/agent/eval";

async function main() {
  const { checks, momentum, model } = await runPatchHealth();

  console.log("\nst-eve patch health\n");
  console.log("coverage:");
  let clean = true;
  for (const c of checks) {
    const ok = c.pass === c.total;
    clean &&= ok;
    console.log(`  ${ok ? "✓" : "!"} ${c.label} — ${c.pass}/${c.total}${ok ? "" : ` (gaps: ${c.gaps.join(", ")})`}`);
  }

  console.log(`\nmomentum (${model}):`);
  if (momentum.length === 0) console.log("  nothing flagged");
  for (const m of momentum) console.log(`  ${m.momentum === "at_risk" ? "⚑" : "·"} ${m.account} — ${m.momentum}: ${m.note}`);
  console.log("");

  process.exit(clean ? 0 : 1);
}

main();
