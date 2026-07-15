import { desc, eq } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import {
  accounts,
  activities,
  briefs,
  contacts,
  evalRuns,
  personas,
  type Account,
  type Brief,
  type EvalRun,
  type Persona,
} from "@/db/schema";
import { ACCOUNTS, ACTIVITIES, CONTACTS, PERSONAS } from "@/lib/seed";
import { ensureSeeded } from "@/data/provision";
import { isWin, type Priority, type Stage } from "@/lib/domain";

/*
 * The one place the app reads/writes data. Account context (accounts, contacts, activities) now
 * lives in Neon so it's editable and persists — but it's *born* from the in-repo seed, which is
 * still the canonical demo state and the eval's pinned ground truth. Reads self-heal: the first
 * one provisions + seeds an empty database, and any DB error falls back to the seed so a hiccup
 * degrades to read-only instead of a 500. Generated artifacts (briefs, eval runs) persist too.
 */

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// Run a DB read, but never let it take the page down: no DB → seed, seed the DB if it's empty,
// and on any error serve the seed. Callers get live data when the DB is healthy, the seed when
// it isn't.
async function readDb<T>(run: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!hasDb || !db) return fallback();
  try {
    await ensureSeeded();
    return await run();
  } catch (err) {
    console.error("[repository] read failed, serving seed:", err);
    return fallback();
  }
}

// ---- static context (now DB-backed, seed as the fallback + ground truth) ----

export function getPersonas(): Promise<Persona[]> {
  return readDb(
    async () => {
      const rows = await db!.select().from(personas);
      return rows.length ? rows : PERSONAS; // defensive: never leave the switcher empty
    },
    () => PERSONAS,
  );
}

export function getPatch(personaId: string) {
  return readDb(
    async () => {
      const rows = await db!.select().from(accounts).where(eq(accounts.personaId, personaId));
      return buildPatch(rows);
    },
    () => buildPatch(ACCOUNTS.filter((a) => a.personaId === personaId)),
  );
}

export function getAccount(accountId: string) {
  return readDb(
    async () => {
      const [account] = await db!.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (!account) return null;
      const [contactRows, activityRows] = await Promise.all([
        db!.select().from(contacts).where(eq(contacts.accountId, accountId)),
        db!
          .select()
          .from(activities)
          .where(eq(activities.accountId, accountId))
          .orderBy(desc(activities.occurredAt)),
      ]);
      return { account, contacts: contactRows, activities: activityRows };
    },
    () => getSeedAccount(accountId),
  );
}

// Always the seed, never the DB — this is what the eval grades against, so it has to stay put
// even after a user edits or restages the live account.
export function getSeedAccount(accountId: string) {
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

function buildPatch(list: Account[]) {
  const sorted = [...list].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority as Priority] - PRIORITY_RANK[b.priority as Priority] ||
      a.lastTouch.getTime() - b.lastTouch.getTime(),
  );

  return {
    accounts: sorted,
    kpis: {
      accounts: sorted.length,
      atRisk: sorted.filter((a) => a.atRisk).length,
      // no next step captured yet = something's waiting on the SE
      awaiting: sorted.filter((a) => !a.nextStep).length,
      wins: sorted.filter((a) => isWin(a.stage as Stage)).length,
    },
  };
}

// ---- generated artifacts ----

type NewBrief = Omit<typeof briefs.$inferInsert, "id" | "createdAt">;
type NewEvalRun = Omit<typeof evalRuns.$inferInsert, "id" | "createdAt">;

// Process-local fallback when there's no DB. Module-level state doesn't survive Next's
// route/RSC boundaries or HMR, so we park it on globalThis — one store per process. (Prod
// uses Neon; serverless invocations wouldn't share memory anyway.)
const store = globalThis as unknown as { __steveBriefs?: Brief[]; __steveEvalRuns?: EvalRun[] };
store.__steveBriefs ??= [];
store.__steveEvalRuns ??= [];
const memBriefs = store.__steveBriefs;
const memEvalRuns = store.__steveEvalRuns;

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
