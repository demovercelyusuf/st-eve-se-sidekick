import type { Account, Activity, Contact } from "@/db/schema";

// Everything is dated relative to this fixed anchor so the seed is fully deterministic.
export const SEED_ANCHOR = new Date("2026-07-14T09:00:00.000Z");

/** anchor minus N days, as an absolute timestamp. */
function daysAgo(n: number): Date {
  return new Date(SEED_ANCHOR.getTime() - n * 24 * 60 * 60 * 1000);
}
void daysAgo; // used once the generated rows below reference it

// --- generated seed (filled by the seed workflow) ---
export const ACCOUNTS: Account[] = [];
export const CONTACTS: Contact[] = [];
export const ACTIVITIES: Activity[] = [];
