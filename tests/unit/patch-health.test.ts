import { describe, it, expect, vi } from "vitest";
import { ACCOUNTS } from "@/lib/seed";

// Force the no-gateway path so Patch Health is fully deterministic (coverage checks only, no
// model call). We test the coverage logic — the part that must never regress silently.
vi.mock("@/agent/models", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/agent/models")>()),
  gatewayReady: false,
}));

const { runPatchHealth } = await import("@/agent/eval");

describe("runPatchHealth coverage", () => {
  it("runs five coverage checks over the whole patch", async () => {
    const health = await runPatchHealth();
    expect(health.checks).toHaveLength(5);
    for (const c of health.checks) expect(c.total).toBe(ACCOUNTS.length);
  });

  it("passes the always-present fields for every seed account", async () => {
    const { checks } = await runPatchHealth();
    const by = Object.fromEntries(checks.map((c) => [c.label, c]));
    expect(by["Every opportunity has a stage"].pass).toBe(ACCOUNTS.length);
    expect(by["Every opportunity has a next step"].pass).toBe(ACCOUNTS.length);
    expect(by["Every opportunity has a close target"].pass).toBe(ACCOUNTS.length);
  });

  it("skips the momentum read and says so without a gateway", async () => {
    const health = await runPatchHealth();
    expect(health.momentum).toEqual([]);
    expect(health.model).toMatch(/coverage only/i);
  });
});
