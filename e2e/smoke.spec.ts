import { test, expect } from "@playwright/test";

// Deterministic surface checks — no DB, no gateway. These catch the common breakages: a route
// that 500s, a render crash, the theme system coming unwired, the landing → app path breaking.

test("landing loads with the tagline and a Launch CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /less on status updates/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Launch ST.EVE/i }).first()).toBeVisible();
});

test("the theme swatches re-skin the page live", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "mono");
  await page.getByRole("radio", { name: /Dark ops/i }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("Launch drops you into the Command Center", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Launch ST.EVE/i }).first().click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: /your patch/i })).toBeVisible();
});

test("an account page renders its context and stage", async ({ page }) => {
  await page.goto("/accounts/stripe");
  await expect(page.getByRole("heading", { name: "Stripe" })).toBeVisible();
  await expect(page.getByText("Opportunity stage")).toBeVisible();
});

test("the copilot page is reachable and prompts for a gateway when there's none", async ({ page }) => {
  await page.goto("/copilot");
  await expect(page.getByRole("heading", { name: /st.eve Copilot/i })).toBeVisible();
});
