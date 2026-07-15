import { describe, it, expect } from "vitest";
import { finalizeBrief, type AccountContext } from "@/agent/generate-brief";
import type { Account, Activity } from "@/db/schema";
import type { BriefOutput } from "@/agent/brief-schema";

// finalizeBrief is the grounding gate: it drops any citation that doesn't resolve to a real
// activity id and only calls a brief "grounded" if every cited id is real. This is the
// anti-hallucination guarantee, so it gets the hardest tests.

const activity = (id: string): Activity => ({
  id,
  accountId: "acme",
  kind: "note",
  summary: "s",
  body: "b",
  source: null,
  occurredAt: new Date("2026-07-01T00:00:00Z"),
});

const ctx = (ids: string[]): AccountContext => ({
  account: { id: "acme", name: "Acme" } as unknown as Account,
  contacts: [],
  activities: ids.map(activity),
});

const output = (citationIds: string[], stepCitationIds: string[]): BriefOutput => ({
  inferredStage: "pov",
  inferredConfidence: 0.8,
  sfdcSummary: "summary",
  slackUpdate: "update",
  nextSteps: [{ priority: "high", text: "do the thing", owner: "You", citations: stepCitationIds }],
  citations: citationIds.map((activityId) => ({ label: "l", activityId })),
});

describe("finalizeBrief grounding", () => {
  it("marks a brief grounded when every cited id resolves", () => {
    const b = finalizeBrief("acme", output(["a1", "a2"], ["a1"]), ctx(["a1", "a2", "a3"]), "m", 100);
    expect(b.grounded).toBe(true);
    expect(b.citations).toHaveLength(2);
  });

  it("drops an unknown citation and flags the brief as not grounded", () => {
    const b = finalizeBrief("acme", output(["a1", "a9"], ["a1"]), ctx(["a1", "a2"]), "m", 100);
    expect(b.grounded).toBe(false); // a9 doesn't exist
    expect(b.citations.map((c) => c.activityId)).toEqual(["a1"]); // a9 dropped
  });

  it("filters bogus ids out of a next step's citations", () => {
    const b = finalizeBrief("acme", output(["a1"], ["a1", "a9"]), ctx(["a1", "a2"]), "m", 100);
    expect(b.nextSteps[0].citations).toEqual(["a1"]);
  });

  it("is not grounded when nothing is cited at all", () => {
    const b = finalizeBrief("acme", output([], []), ctx(["a1"]), "m", 100);
    expect(b.grounded).toBe(false);
  });

  it("records model + latency and no token field", () => {
    const b = finalizeBrief("acme", output(["a1"], ["a1"]), ctx(["a1"]), "sonnet", 1234);
    expect(b.meta).toEqual({ model: "sonnet", latencyMs: 1234 });
  });
});
