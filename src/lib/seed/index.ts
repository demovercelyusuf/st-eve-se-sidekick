import type { Account, Activity, Contact, Persona } from "@/db/schema";

// The patches you can switch between in the persona picker.
export const PERSONAS: Persona[] = [
  { id: "you", name: "You", blurb: "18 accounts · 2 AM patches" },
  { id: "sample", name: "Sample patch", blurb: "6 demo accounts" },
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
