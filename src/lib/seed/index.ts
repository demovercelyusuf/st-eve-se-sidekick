import type { Account, Activity, Contact, Persona } from "@/db/schema";

// Bump this whenever the seed data changes — the DB compares it against what it has loaded and
// truncates + reloads when they differ. Dated + named so the history reads clearly.
export const SEED_VERSION = "2026-07-15-vercel-customers-2";

// The patches you can switch between in the persona picker.
export const PERSONAS: Persona[] = [
  { id: "you", name: "You", blurb: "14 accounts · 4 AM patches" },
  { id: "sample", name: "Sample patch", blurb: "4 demo accounts" },
];

/*
 * The synthetic account context. It's generated once, adversarially checked, and then
 * committed — so the demo is repeatable and this same data doubles as the labeled ground
 * truth the evals grade against. Dates are anchored to a fixed "today" (see accounts.ts),
 * so nothing shifts between runs.
 *
 * Filled in by the seed workflow; kept split out so this index stays the stable import.
 */
export { ACCOUNTS, CONTACTS, ACTIVITIES } from "./accounts";

export type { Account, Activity, Contact, Persona };
