import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next, so it won't pick up .env.local on its own — load it.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local yet; DATABASE_URL may come from the shell instead
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
