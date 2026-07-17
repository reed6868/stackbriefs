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

test("forced colors preserve the mobile menu glyph and interaction", async ({ browser, page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Forced-colors emulation is verified in Chromium");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open menu" });
  const glyphContrasts = await page.locator(".menu-button").evaluate((button) => {
    const bar = button.querySelector("span");
    if (!bar) return false;
    const surface = getComputedStyle(button).backgroundColor;
    return [
      getComputedStyle(bar).backgroundColor,
      getComputedStyle(bar, "::before").backgroundColor,
      getComputedStyle(bar, "::after").backgroundColor,
    ].every((color) => color !== surface);
  });
  expect(glyphContrasts).toBe(true);

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  await expect(trigger).toBeFocused();

  const touchContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    hasTouch: true,
    viewport: { width: 360, height: 800 },
  });
  const touchPage = await touchContext.newPage();
  await touchPage.emulateMedia({ forcedColors: "active" });
  await touchPage.goto("/");
  await touchPage.getByRole("button", { name: "Open menu" }).tap();
  await expect(touchPage.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await touchPage.getByRole("button", { name: "Close menu" }).tap();
  await expect(touchPage.getByRole("dialog", { name: "Menu" })).toBeHidden();
  await touchContext.close();
});
