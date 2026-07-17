import { expect, test } from "@playwright/test";

import {
  assertNoSeriousAxeViolations,
  expectNoPageOverflow,
} from "./helpers";

for (const path of ["/decision/never-published", "/tool/never-published"]) {
  test(`never-published route ${path} resolves to the recovery-only 404`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("Page unavailable | StackBriefs");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    await expect(page.locator('[data-status="unavailable"]')).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Recovery" })).toBeVisible();
    await expect(page.getByText(/filter|compare|shortlist|official link/i)).toHaveCount(0);
    await expectNoPageOverflow(page);
    await assertNoSeriousAxeViolations(page);
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });
}
