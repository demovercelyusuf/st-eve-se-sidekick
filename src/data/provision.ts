import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { accounts, activities, contacts, personas } from "@/db/schema";
import { ACCOUNTS, ACTIVITIES, CONTACTS, PERSONAS } from "@/lib/seed";

/*
 * Getting the seed into Neon.
 *
 * Normally you'd `drizzle-kit push` + run a seed script, but DATABASE_URL is a Sensitive Vercel
 * var — it never comes down to a laptop — so there's no local path to the DB. The running app,
 * though, has it. So we provision and seed from inside the app: create the tables if they're
 * missing and load them from the in-repo seed. `ensureSeeded` does this lazily on first access
 * (self-healing, no manual step); `resetDemo` is the explicit "put the demo back" button.
 */

// Idempotent DDL — safe to run on every cold start. Enums need the DO/EXCEPTION dance because
// Postgres has no CREATE TYPE IF NOT EXISTS. No foreign keys: the app joins by id in code, and
// skipping them keeps truncate-and-reseed order-independent. briefs + eval_runs already exist.
const DDL: string[] = [
  `DO $$ BEGIN CREATE TYPE "stage" AS ENUM('discovery','new_business_meeting','deeper_dive','pov','technical_win','sizing_scoping','quote'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "priority" AS ENUM('high','medium','low'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "activity_kind" AS ENUM('note','email','slack','call','meeting'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "relationship" AS ENUM('champion','economic_buyer','influencer','user','blocker'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "sentiment" AS ENUM('aligned','neutral','skeptical'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS "personas" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "blurb" text NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS "accounts" ("id" text PRIMARY KEY NOT NULL, "persona_id" text NOT NULL, "name" text NOT NULL, "industry" text NOT NULL, "arr" integer NOT NULL, "stage" "stage" NOT NULL, "priority" "priority" NOT NULL, "at_risk" boolean DEFAULT false NOT NULL, "next_step" text, "close_target" text, "am_name" text, "last_touch" timestamptz NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS "contacts" ("id" text PRIMARY KEY NOT NULL, "account_id" text NOT NULL, "name" text NOT NULL, "title" text NOT NULL, "relationship" "relationship" NOT NULL, "sentiment" "sentiment" NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS "activities" ("id" text PRIMARY KEY NOT NULL, "account_id" text NOT NULL, "kind" "activity_kind" NOT NULL, "summary" text NOT NULL, "body" text NOT NULL, "source" text, "occurred_at" timestamptz NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS "todos" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "account_id" text NOT NULL, "text" text NOT NULL, "done" boolean DEFAULT false NOT NULL, "priority" "priority" DEFAULT 'medium' NOT NULL, "due" text, "created_at" timestamptz DEFAULT now() NOT NULL);`,
  `CREATE INDEX IF NOT EXISTS "accounts_persona_idx" ON "accounts" ("persona_id");`,
  `CREATE INDEX IF NOT EXISTS "contacts_account_idx" ON "contacts" ("account_id");`,
  `CREATE INDEX IF NOT EXISTS "activities_account_idx" ON "activities" ("account_id");`,
  `CREATE INDEX IF NOT EXISTS "todos_account_idx" ON "todos" ("account_id");`,
];

async function provisionSchema() {
  if (!hasDb || !db) return;
  for (const stmt of DDL) await db.execute(sql.raw(stmt));
}

// onConflictDoNothing so two concurrent cold starts racing to seed can't double-insert.
async function insertSeed() {
  if (!hasDb || !db) return;
  await db.insert(personas).values(PERSONAS).onConflictDoNothing();
  await db.insert(accounts).values(ACCOUNTS).onConflictDoNothing();
  await db.insert(contacts).values(CONTACTS).onConflictDoNothing();
  await db.insert(activities).values(ACTIVITIES).onConflictDoNothing();
}

// Ensures the DB is provisioned and seeded, at most once per warm instance. Best-effort: if
// anything fails we swallow it and let the repository's read fallback serve the seed instead,
// so a DB hiccup degrades to read-only rather than a 500.
let ensured = false;
export async function ensureSeeded() {
  if (!hasDb || !db || ensured) return;
  try {
    const rows = await db.select({ id: accounts.id }).from(accounts).limit(1);
    if (rows.length === 0) await insertSeed();
    ensured = true;
  } catch {
    // accounts table doesn't exist yet — first ever boot against this database. Provision then
    // seed; only mark ready if both land, so a failure retries next request instead of stranding
    // the app on an empty table.
    await provisionSchema();
    await insertSeed();
    ensured = true;
  }
}

// The "reset to demo" action: wipe the account context (leaving generated briefs/eval-runs) and
// reload it from the seed. TRUNCATE has no FKs to fight, so order doesn't matter.
export async function resetDemo() {
  if (!hasDb || !db) return;
  await provisionSchema();
  await db.execute(sql.raw(`TRUNCATE "todos", "activities", "contacts", "accounts", "personas";`));
  await insertSeed();
  ensured = true;
}
