import { expect, test } from "@playwright/test";

import { assertNoSeriousAxeViolations, expectNoPageOverflow } from "./helpers";

for (const lifecycle of [
  {
    path: "/tool/alpha-writer",
    status: "retired",
    title: "Alpha Writer retired | StackBriefs",
    heading: "Alpha Writer has retired",
  },
  {
    path: "/tool/bravo-draft",
    status: "blocked",
    title: "Bravo Draft temporarily unavailable | StackBriefs",
    heading: "Bravo Draft is temporarily unavailable",
  },
] as const) {
  test(`${lifecycle.status} lifecycle page is recovery-only and noindex`, async ({ page }) => {
    const response = await page.goto(lifecycle.path);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(lifecycle.title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    await expect(page.locator(`[data-status="${lifecycle.status}"]`)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: lifecycle.heading })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Recovery" })).toBeVisible();
    await expect(page.getByText(/filter|compare|shortlist|official link/i)).toHaveCount(0);
    await expectNoPageOverflow(page);
    await assertNoSeriousAxeViolations(page);
  });
}

test("replacement route resolves to the current published Scenario", async ({ page }) => {
  await page.goto("/decision/writing-assistants");

  await expect(page).toHaveURL(/\/decision\/meeting-assistants$/);
  await expect(page.getByRole("heading", { level: 1, name: "AI meeting assistants for client calls" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
});

test("never-published Tool route stays absent", async ({ page }) => {
  const response = await page.goto("/tool/never-launched");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page unavailable | StackBriefs");
  await expect(page.locator('[data-status="unavailable"]')).toBeVisible();
});
