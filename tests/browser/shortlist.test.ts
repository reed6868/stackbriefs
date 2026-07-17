import { expect, test } from "@playwright/test";

import {
  assertNoSeriousAxeViolations,
  captureViewportScreenshot,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";
import { expandWritingScenario } from "./expanded-writing-fixture";

const writingPath = "/decision/writing-assistants";

test("desktop shortlist stays URL-only and retains changing eligibility", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  await page.goto(writingPath);
  const historyLength = await page.evaluate(() => history.length);
  const dock = page.locator("[data-shortlist-dock]");
  const alphaCard = page.locator('[data-candidate-card="candidate-writing-alpha"]');
  const bravoCard = page.locator('[data-candidate-card="candidate-writing-bravo"]');

  await expect(dock).toBeHidden();
  await alphaCard.getByRole("button", { name: "Add Alpha Writer to shortlist" }).click();
  await expect(page).toHaveURL(`${writingPath}?shortlist=alpha-writer`);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await expect(dock).toBeVisible();
  await expect(dock.locator("[data-shortlist-count]")).toHaveText("1 tool shortlisted");
  await expect(dock.locator("[data-shortlist-count]")).toHaveAttribute("aria-live", "polite");
  await expect(dock.getByRole("button", { name: "Compare shortlisted Tools" })).toBeDisabled();
  await expect(dock.getByText("Choose at least two Tools to compare.", { exact: true })).toBeVisible();

  await page.reload();
  await expect(dock).toBeVisible();
  await expect(alphaCard.getByRole("button", { name: "Remove Alpha Writer from shortlist" }))
    .toHaveAttribute("aria-pressed", "true");

  await bravoCard.getByRole("button", { name: "Add Bravo Draft to shortlist" }).click();
  await expect(page).toHaveURL(`${writingPath}?shortlist=alpha-writer,bravo-draft`);
  await expect(dock.locator("[data-shortlist-count]")).toHaveText("2 tools shortlisted");
  await expect(dock.getByRole("button", { name: "Compare shortlisted Tools" })).toBeEnabled();

  const filters = page.locator('[data-decision-filter-form="desktop"]');
  await filters.getByLabel("Export formats value").selectOption("pdf");
  await filters.getByLabel("Use Export formats as").selectOption("required");
  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&shortlist=alpha-writer,bravo-draft`,
  );
  await expect(dock.locator('[data-shortlist-item="alpha-writer"]')).toContainText(
    "No longer matches required conditions",
  );
  await expect(dock.locator('[data-shortlist-item="bravo-draft"]')).toContainText(
    "Matches current filters",
  );
  await expect(page.locator('[data-excluded-candidate="candidate-writing-alpha"]')
    .getByRole("button", { name: "Remove Alpha Writer from shortlist" })).toBeVisible();

  if (testInfo.project.name === "chromium") {
    await captureViewportScreenshot(page, testInfo, "shortlist-desktop", { width: 1440, height: 1000 });
    await captureViewportScreenshot(page, testInfo, "shortlist-tablet", { width: 768, height: 900 });
  }

  await dock.locator('[data-shortlist-item="alpha-writer"]')
    .getByRole("button", { name: "Remove Alpha Writer from shortlist" }).click();
  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf&shortlist=bravo-draft`);
  await expect(dock.locator('[data-shortlist-item="bravo-draft"]')
    .getByRole("button", { name: "Remove Bravo Draft from shortlist" })).toBeFocused();

  await dock.locator('[data-shortlist-item="bravo-draft"]')
    .getByRole("button", { name: "Remove Bravo Draft from shortlist" }).click();
  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf`);
  await expect(dock).toBeHidden();
  await expect(bravoCard.getByRole("button", { name: "Add Bravo Draft to shortlist" })).toBeFocused();

  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({
    local: 0,
    session: 0,
  });
  expect(await page.context().cookies()).toEqual([]);
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("mobile shortlist restores URL snapshots through filter History", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const pageErrors = watchPageErrors(page);
  await page.goto(`${writingPath}?shortlist=alpha-writer`);
  const dock = page.locator("[data-shortlist-dock]");
  const dialog = page.getByRole("dialog", { name: "Filters" });
  const mobileFilters = dialog.locator('[data-decision-filter-form="mobile"]');
  const summary = page.locator("#result-summary");

  await expect(dock).toBeVisible();
  await page.getByRole("button", { name: /Filters/ }).click();
  await mobileFilters.getByLabel("Export formats value").selectOption("pdf");
  await mobileFilters.getByLabel("Use Export formats as").selectOption("required");
  await dialog.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf&shortlist=alpha-writer`);
  await expect(summary).toBeFocused();
  await expect(dock.locator('[data-shortlist-item="alpha-writer"]')).toContainText(
    "No longer matches required conditions",
  );

  await page.locator('[data-candidate-card="candidate-writing-bravo"]')
    .getByRole("button", { name: "Add Bravo Draft to shortlist" }).click();
  await dock.locator('[data-shortlist-item="alpha-writer"]')
    .getByRole("button", { name: "Remove Alpha Writer from shortlist" }).click();
  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf&shortlist=bravo-draft`);

  if (testInfo.project.name === "chromium") {
    await captureViewportScreenshot(page, testInfo, "shortlist-mobile", { width: 360, height: 800 });
  }

  const footerLink = page.getByRole("contentinfo").getByRole("link", { name: "Affiliate disclosure" });
  await footerLink.focus();
  await footerLink.scrollIntoViewIfNeeded();
  const focusedBounds = await footerLink.boundingBox();
  const dockBounds = await dock.boundingBox();
  expect(focusedBounds).not.toBeNull();
  expect(dockBounds).not.toBeNull();
  expect(focusedBounds!.y + focusedBounds!.height).toBeLessThanOrEqual(dockBounds!.y);

  await page.goBack();
  await expect(page).toHaveURL(`${writingPath}?shortlist=alpha-writer`);
  await expect(summary).toBeFocused();
  await expect(dock.locator('[data-shortlist-item="alpha-writer"]')).toBeVisible();
  await expect(dock.locator('[data-shortlist-item="bravo-draft"]')).toBeHidden();

  await page.goForward();
  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf&shortlist=bravo-draft`);
  await expect(summary).toBeFocused();
  await expect(dock.locator('[data-shortlist-item="alpha-writer"]')).toBeHidden();
  await expect(dock.locator('[data-shortlist-item="bravo-draft"]')).toBeVisible();
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("full shortlist rejects a fifth Tool with a visible reason", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.route(`**${writingPath}*`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: expandWritingScenario(await response.text()) });
  });
  await page.goto(
    `${writingPath}?shortlist=alpha-writer,bravo-draft,charlie-compose,delta-write`,
  );
  const dock = page.locator("[data-shortlist-dock]");
  const echoToggle = page.locator('[data-candidate-card="candidate-writing-echo"]')
    .getByRole("button", { name: "Add Echo Editor to shortlist" });

  await expect(dock.locator("[data-shortlist-count]")).toHaveText("4 tools shortlisted");
  await expect(dock.locator("[data-shortlist-limit]")).toHaveText(
    "Shortlist is full. Remove a Tool before adding another.",
  );
  await expect(dock.locator("[data-shortlist-limit]")).toBeVisible();
  await expect(echoToggle).toHaveAttribute("aria-disabled", "true");
  await expect(echoToggle).toHaveAttribute("aria-describedby", "shortlist-limit-reason");
  const urlBeforeAttempt = page.url();

  await echoToggle.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(urlBeforeAttempt);
  await expect(dock.locator("[data-shortlist-count]")).toHaveText("4 tools shortlisted");
  await expect(dock.locator('[data-shortlist-item="echo-editor"]')).toBeHidden();
  await expect(dock.locator("[data-shortlist-message]")).toHaveText(
    "Shortlist is full. Remove a Tool before adding another.",
  );
  await expect(dock.locator("[data-shortlist-message]")).toBeVisible();
  await expect(echoToggle).toBeFocused();
  const focusedBounds = await echoToggle.boundingBox();
  const dockBounds = await dock.boundingBox();
  expect(focusedBounds).not.toBeNull();
  expect(dockBounds).not.toBeNull();
  expect(focusedBounds!.y + focusedBounds!.height).toBeLessThanOrEqual(dockBounds!.y);
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});
