import { defineConfig, devices } from "@playwright/test";

// Tier 1 — the blocking gate. Runs the built app in its deterministic mode: no AI Gateway
// credentials and no DATABASE_URL, so briefs fall back to the deterministic composer and the
// copilot shows its "connect a gateway" state. No model flakiness, no external services — just
// "does every surface still render and behave". CRUD-persistence specs skip themselves unless a
// DATABASE_URL is present (see e2e/crud.spec.ts).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
