import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

/*
 * One Neon pool, reused across requests — Fluid Compute keeps the instance warm, so we
 * don't pay a connect on every call. When DATABASE_URL isn't set (local dev before Neon
 * is wired), db is null and the repository quietly falls back to the in-memory seed, so
 * the app still runs. Flip the env var and the same code is talking to real Postgres.
 */
const url = process.env.DATABASE_URL;

export const db: NeonDatabase<typeof schema> | null = url
  ? drizzle(new Pool({ connectionString: url }), { schema })
  : null;

export const hasDb = db !== null;
