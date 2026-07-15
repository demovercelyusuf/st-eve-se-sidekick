import { describe, it, expect } from "vitest";
import { ACCOUNTS, CONTACTS, ACTIVITIES, PERSONAS } from "@/lib/seed";

// The seed is the pinned ground truth for the demo and the eval. If it drifts — a duplicate
// activity id, an orphaned contact, a missing next step — grounding and Patch Health quietly
// break. These checks keep it honest.

describe("seed integrity", () => {
  const accountIds = new Set(ACCOUNTS.map((a) => a.id));
  const personaIds = new Set(PERSONAS.map((p) => p.id));

  it("has unique account ids and unique activity ids", () => {
    expect(new Set(ACCOUNTS.map((a) => a.id)).size).toBe(ACCOUNTS.length);
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });

  it("has no orphaned contacts or activities", () => {
    for (const c of CONTACTS) expect(accountIds.has(c.accountId)).toBe(true);
    for (const a of ACTIVITIES) expect(accountIds.has(a.accountId)).toBe(true);
  });

  it("gives every account a persona, a next step, and a close target", () => {
    for (const a of ACCOUNTS) {
      expect(personaIds.has(a.personaId)).toBe(true);
      expect(a.nextStep && a.nextStep.length).toBeTruthy();
      expect(a.closeTarget && a.closeTarget.length).toBeTruthy();
    }
  });

  it("writes account managers as first-name + initial (e.g. Mike B.)", () => {
    for (const a of ACCOUNTS) {
      expect(a.amName).toBeTruthy();
      expect(a.amName).toMatch(/^[A-Za-z]+ [A-Z]\.$/);
    }
  });

  it("gives every account at least one activity to ground against", () => {
    for (const a of ACCOUNTS) {
      expect(ACTIVITIES.some((x) => x.accountId === a.id)).toBe(true);
    }
  });
});
