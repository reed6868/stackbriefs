import { expect, test } from "@playwright/test";

import {
  activateWithKeyboard,
  assertNoSeriousAxeViolations,
  captureResponsiveScreenshots,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";

test("Static Home to Decision remains usable, accessible, and contained", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);

  await page.goto("/");
  await expect(page).toHaveTitle(/StackBriefs/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with a use case");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);

  await activateWithKeyboard(
    page,
    page.getByRole("link", { name: "AI meeting assistants for client calls" }),
  );
  await expect(page).toHaveURL(/\/decision\/meeting-assistants$/);
  await expect(page).toHaveTitle("AI meeting assistants for client calls | StackBriefs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AI meeting assistants for client calls");
  await expect(page.getByText("Decision criteria", { exact: true })).toBeVisible();
  await expect(page.getByText("Evidence summary", { exact: true }).first()).toBeVisible();

  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);

  if (testInfo.project.name === "chromium") {
    await captureResponsiveScreenshots(page, testInfo, "decision-meeting-assistants");
  }

  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});
