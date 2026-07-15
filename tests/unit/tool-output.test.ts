import { describe, it, expect } from "vitest";
import { accountContextView } from "@/agent/copilot-agent";
import type { AccountContext } from "@/agent/generate-brief";
import type { Account, Activity, Contact } from "@/db/schema";

// Regression guard for the copilot outage: get_account_context used to hand the model the raw DB
// row (Date and all), and serializing a Date back into the tool loop killed the stream. The tool
// output must be plain, JSON-safe data — no Date objects anywhere.

function containsDate(v: unknown): boolean {
  if (v instanceof Date) return true;
  if (Array.isArray(v)) return v.some(containsDate);
  if (v && typeof v === "object") return Object.values(v).some(containsDate);
  return false;
}

const ctx: AccountContext = {
  account: {
    id: "acme",
    personaId: "you",
    name: "Acme",
    industry: "SaaS",
    arr: 100000,
    stage: "pov",
    priority: "high",
    atRisk: false,
    nextStep: "ship the POV",
    closeTarget: "Q1 FY27",
    amName: "Mike B.",
    lastTouch: new Date("2026-07-01T00:00:00Z"),
  } as Account,
  contacts: [
    { id: "c1", accountId: "acme", name: "Nat", title: "VP Eng", relationship: "champion", sentiment: "aligned" } as Contact,
  ],
  activities: [
    { id: "a1", accountId: "acme", kind: "note", summary: "s", body: "b", source: null, occurredAt: new Date("2026-06-20T00:00:00Z") } as Activity,
  ],
};

describe("accountContextView", () => {
  it("returns no Date objects anywhere", () => {
    expect(containsDate(accountContextView(ctx))).toBe(false);
  });

  it("renders lastTouch as a string label, not a Date", () => {
    const view = accountContextView(ctx);
    expect(typeof view.account.lastTouch).toBe("string");
    expect(typeof view.activities[0].when).toBe("string");
  });

  it("round-trips through JSON unchanged (fully serializable)", () => {
    const view = accountContextView(ctx);
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
  });
});
