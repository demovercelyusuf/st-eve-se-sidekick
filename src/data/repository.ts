import { desc, eq } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { briefs, evalRuns, type Brief, type EvalRun } from "@/db/schema";
import { ACCOUNTS, ACTIVITIES, CONTACTS, PERSONAS } from "@/lib/seed";
import { isWin, type Priority, type Stage } from "@/lib/domain";

/*
 * The one place the app reads/writes data. Static account context comes from the versioned
 * seed — it's synthetic and deterministic, and keeping it in code means the demo is
 * reproducible and IS the eval ground truth. The dynamic stuff st-eve produces (briefs,
 * eval runs) goes to Neon when DATABASE_URL is set, and to a process-local store otherwise
 * so local dev still works before Neon is wired.
 */

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// ---- static context ----

export function getPersonas() {
  return PERSONAS;
}

export function getPatch(personaId: string) {
  const accounts = ACCOUNTS.filter((a) => a.personaId === personaId).sort(
    (a, b) =>
      PRIORITY_RANK[a.priority as Priority] - PRIORITY_RANK[b.priority as Priority] ||
      a.lastTouch.getTime() - b.lastTouch.getTime(),
  );

  return {
    accounts,
    kpis: {
      accounts: accounts.length,
      atRisk: accounts.filter((a) => a.atRisk).length,
      // no next step captured yet = something's waiting on the SE
      awaiting: accounts.filter((a) => !a.nextStep).length,
      wins: accounts.filter((a) => isWin(a.stage as Stage)).length,
    },
  };
}

export function getAccount(accountId: string) {
  const account = ACCOUNTS.find((a) => a.id === accountId);
  if (!account) return null;
  return {
    account,
    contacts: CONTACTS.filter((c) => c.accountId === accountId),
    activities: ACTIVITIES.filter((a) => a.accountId === accountId).sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
    ),
  };
}

// ---- generated artifacts ----

type NewBrief = Omit<typeof briefs.$inferInsert, "id" | "createdAt">;
type NewEvalRun = Omit<typeof evalRuns.$inferInsert, "id" | "createdAt">;

// Process-local fallback when there's no DB. Fine for a single dev server; prod uses Neon.
const memBriefs: Brief[] = [];
const memEvalRuns: EvalRun[] = [];

export async function saveBrief(input: NewBrief): Promise<Brief> {
  if (hasDb && db) {
    const [row] = await db.insert(briefs).values(input).returning();
    return row;
  }
  const row: Brief = { ...input, meta: input.meta ?? null, id: crypto.randomUUID(), createdAt: new Date() };
  memBriefs.unshift(row);
  return row;
}

export async function getLatestBrief(accountId: string): Promise<Brief | null> {
  if (hasDb && db) {
    const [row] = await db
      .select()
      .from(briefs)
      .where(eq(briefs.accountId, accountId))
      .orderBy(desc(briefs.createdAt))
      .limit(1);
    return row ?? null;
  }
  return memBriefs.find((b) => b.accountId === accountId) ?? null;
}

export async function saveEvalRun(input: NewEvalRun): Promise<EvalRun> {
  if (hasDb && db) {
    const [row] = await db.insert(evalRuns).values(input).returning();
    return row;
  }
  const row: EvalRun = { ...input, id: crypto.randomUUID(), createdAt: new Date() };
  memEvalRuns.unshift(row);
  return row;
}

export async function getEvalRuns(limit = 10): Promise<EvalRun[]> {
  if (hasDb && db) {
    return db.select().from(evalRuns).orderBy(desc(evalRuns.createdAt)).limit(limit);
  }
  return memEvalRuns.slice(0, limit);
}
