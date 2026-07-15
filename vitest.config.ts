import { defineConfig } from "vitest/config";

// Unit / integration tests only — the fast, deterministic layer that guards the load-bearing
// logic (grounding, tool-output shape, Patch Health coverage, seed integrity). The Playwright
// E2E suite lives under e2e/ and runs separately.
export default defineConfig({
  resolve: { tsconfigPaths: true }, // resolve "@/..." from tsconfig paths
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
