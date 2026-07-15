import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { accounts, activities, contacts, personas, seedMeta } from "@/db/schema";
import { ACCOUNTS, ACTIVITIES, CONTACTS, PERSONAS, SEED_VERSION } from "@/lib/seed";

/*
 * Getting the seed into Neon.
 *
 * Normally you'd `drizzle-kit push` + run a seed script, but DATABASE_URL is a Sensitive Vercel
 * var — it never comes down to a laptop — so there's no local path to the DB. The running app,
 * though, has it. So we provision and seed from inside the app: create the tables if they're
 * missing and load them from the in-repo seed. `ensureSeeded` does this lazily on first access
 * (self-healing, no manual step).
 */

// Idempotent DDL — safe to run on every cold start. Enums need the DO/EXCEPTION dance because
// Postgres has no CREATE TYPE IF NOT EXISTS. No foreign keys: the app joins by id in code, and
// skipping them keeps truncate-and-reseed order-independent. Covers every table the app writes,
// so a completely empty database self-heals on first request (briefs included).
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
  `CREATE TABLE IF NOT EXISTS "briefs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "account_id" text NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL, "sfdc_summary" text NOT NULL, "slack_update" text NOT NULL, "inferred_stage" "stage" NOT NULL, "inferred_confidence" real NOT NULL, "next_steps" jsonb NOT NULL, "citations" jsonb NOT NULL, "grounded" boolean NOT NULL, "meta" jsonb);`,
  `CREATE TABLE IF NOT EXISTS "seed_meta" ("id" integer PRIMARY KEY DEFAULT 1, "version" text NOT NULL);`,
  `CREATE INDEX IF NOT EXISTS "accounts_persona_idx" ON "accounts" ("persona_id");`,
  `CREATE INDEX IF NOT EXISTS "contacts_account_idx" ON "contacts" ("account_id");`,
  `CREATE INDEX IF NOT EXISTS "activities_account_idx" ON "activities" ("account_id");`,
  `CREATE INDEX IF NOT EXISTS "todos_account_idx" ON "todos" ("account_id");`,
];

async function provisionSchema() {
  if (!hasDb || !db) return;
  for (const stmt of DDL) await db.execute(sql.raw(stmt));
}

// Wipe the account context (leaving generated briefs alone) and reload it from the
// seed, then stamp the version. TRUNCATE has no FKs to fight, so order doesn't matter.
async function reload() {
  if (!hasDb || !db) return;
  await db.execute(sql.raw(`TRUNCATE "todos", "activities", "contacts", "accounts", "personas";`));
  await db.insert(personas).values(PERSONAS);
  await db.insert(accounts).values(ACCOUNTS);
  await db.insert(contacts).values(CONTACTS);
  await db.insert(activities).values(ACTIVITIES);
  await db
    .insert(seedMeta)
    .values({ id: 1, version: SEED_VERSION })
    .onConflictDoUpdate({ target: seedMeta.id, set: { version: SEED_VERSION } });
}

// Ensures the DB is provisioned and holding the current seed, at most once per warm instance.
// If the loaded version is behind the code's SEED_VERSION (or the DB is fresh), it re-provisions
// and reloads. Best-effort: on any failure we stay unready so the next request retries, and the
// repository's read fallback serves the seed in the meantime — a hiccup degrades to read-only.
let ensured = false;
export async function ensureSeeded() {
  if (!hasDb || !db || ensured) return;
  try {
    let loaded: string | null = null;
    try {
      const [row] = await db.select().from(seedMeta).limit(1);
      loaded = row?.version ?? null;
    } catch {
      loaded = null; // seed_meta doesn't exist yet — first boot against this database
    }
    if (loaded !== SEED_VERSION) {
      await provisionSchema();
      await reload();
    }
    ensured = true;
  } catch (err) {
    console.error("[provision] ensureSeeded failed, staying on seed fallback:", err);
  }
}
