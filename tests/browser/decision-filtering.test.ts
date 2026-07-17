import { expect, test } from "@playwright/test";

import {
  assertNoSeriousAxeViolations,
  captureViewportScreenshot,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";

const writingPath = "/decision/writing-assistants";

test("desktop filters update results and URL without moving focus", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  await page.goto(writingPath);
  const historyLength = await page.evaluate(() => history.length);
  const filters = page.locator('[data-decision-filter-form="desktop"]');
  const summary = page.locator("#result-summary");

  await filters.getByLabel("Export formats value").selectOption("pdf");
  const exportMode = filters.getByLabel("Use Export formats as");
  await exportMode.focus();
  await exportMode.selectOption("required");

  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf`);
  await expect(exportMode).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("1 tool matches");
  await expect(page.locator('[data-candidate-card="candidate-writing-bravo"]')).toBeVisible();
  await expect(page.locator('[data-candidate-card="candidate-writing-alpha"]')).toBeHidden();
  await expect(page.locator('[data-excluded-candidate="candidate-writing-alpha"]')).toBeVisible();

  await filters.getByLabel("Collaboration mode value").selectOption("shared-workspace");
  const collaborationMode = filters.getByLabel("Use Collaboration mode as");
  await collaborationMode.focus();
  await collaborationMode.selectOption("optional");

  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&p=collaboration-mode:shared-workspace`,
  );
  await expect(collaborationMode).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("1 tool matches");

  await filters.getByLabel("Use Collaboration mode as").selectOption("required");
  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&r=collaboration-mode:shared-workspace`,
  );
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText(
    "No tools match every required condition",
  );
  await expect(page.getByRole("button", { name: "Make Export formats optional" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Make Collaboration mode optional" })).toBeVisible();

  await page.getByRole("button", { name: "Make Export formats optional" }).click();
  await expect(page).toHaveURL(
    `${writingPath}?r=collaboration-mode:shared-workspace&p=export-formats:pdf`,
  );
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("1 tool matches");
  await expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
  await expect(summary).toHaveAttribute("aria-live", "polite");
  await expect(summary).not.toContainText("Alpha Writer");
  await expect(summary).not.toContainText("Bravo Draft");

  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({
    local: 0,
    session: 0,
  });
  expect(await page.context().cookies()).toEqual([]);
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await captureViewportScreenshot(page, testInfo, "decision-tablet-filtered", { width: 768, height: 900 });
    await captureViewportScreenshot(page, testInfo, "decision-desktop-filtered", { width: 1440, height: 1000 });
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("browser expiry downgrades evidence before required filtering", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2030-01-01T12:00:00Z"));
  await page.goto(writingPath);

  const firstSummary = page.locator('[data-candidate-evidence-summary="candidate-writing-alpha"]');
  await expect(firstSummary.getByText("Needs recheck", { exact: true })).toHaveCount(3);
  await expect(firstSummary.getByText("No current value", { exact: true })).toHaveCount(3);

  const filters = page.locator('[data-decision-filter-form="desktop"]');
  await filters.getByLabel("Use Commercial use permitted as").selectOption("required");
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText(
    "No tools match every required condition",
  );
  await expect(page.locator('[data-candidate-card="candidate-writing-alpha"]')).toBeHidden();
  await expect(page.locator('[data-excluded-candidate="candidate-writing-alpha"]')).toContainText(
    "Needs recheck",
  );
});

test("invalid initial state normalizes once and restores controls", async ({ page }) => {
  const initialHistoryLength = await page.evaluate(() => history.length);
  await page.goto(
    `${writingPath}?r=missing:true&r=export-formats:pdf&r=export-formats:docx&p=collaboration-mode:shared-workspace&shortlist=alpha-writer,delta-notes,missing,alpha-writer#comparison`,
  );

  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&p=collaboration-mode:shared-workspace&shortlist=alpha-writer`,
  );
  expect(await page.evaluate(() => history.length)).toBe(initialHistoryLength + 1);
  const filters = page.locator('[data-decision-filter-form="desktop"]');
  await expect(filters.getByLabel("Use Export formats as")).toHaveValue("required");
  await expect(filters.getByLabel("Export formats value")).toHaveValue("pdf");
  await expect(filters.getByLabel("Use Collaboration mode as")).toHaveValue("optional");
  await expect(filters.getByLabel("Collaboration mode value")).toHaveValue("shared-workspace");
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText("1 tool matches");
  const dock = page.locator("[data-shortlist-dock]");
  await expect(dock).toBeVisible();
  await expect(dock.locator('[data-shortlist-item="alpha-writer"]')).toBeVisible();
  await expect(dock.locator('[data-shortlist-item="bravo-draft"]')).toBeHidden();
  await expect(dock.locator("[data-shortlist-count]")).toHaveText("1 tool shortlisted");
});

test("mobile edits stage until Apply and History restores applied snapshots", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const pageErrors = watchPageErrors(page);
  await page.goto(writingPath);
  const trigger = page.getByRole("button", { name: /Filters/ });
  const dialog = page.getByRole("dialog", { name: "Filters" });
  const mobileFilters = dialog.locator('[data-decision-filter-form="mobile"]');
  const summary = page.locator("#result-summary");

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("select").first()).toBeFocused();
  await mobileFilters.getByLabel("Export formats value").selectOption("pdf");
  await mobileFilters.getByLabel("Use Export formats as").selectOption("required");
  await expect(page).toHaveURL(writingPath);
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("2 tools in this Scenario");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(mobileFilters.getByLabel("Use Export formats as")).toHaveValue("inactive");
  await mobileFilters.getByLabel("Export formats value").selectOption("pdf");
  await mobileFilters.getByLabel("Use Export formats as").selectOption("required");
  await mobileFilters.getByLabel("Collaboration mode value").selectOption("shared-workspace");
  await mobileFilters.getByLabel("Use Collaboration mode as").selectOption("required");
  await dialog.getByRole("button", { name: "Apply filters" }).click();

  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&r=collaboration-mode:shared-workspace`,
  );
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText(
    "No tools match every required condition",
  );
  await expect(trigger).toContainText("2 active");
  await page.evaluate(() => { window.name = "decision-history-marker"; });

  await trigger.click();
  await mobileFilters.getByLabel("Use Export formats as").selectOption("optional");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await trigger.click();
  await expect(mobileFilters.getByLabel("Use Export formats as")).toHaveValue("required");

  await page.goBack();
  await expect(page).toHaveURL(writingPath);
  await expect(dialog).toBeHidden();
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("2 tools in this Scenario");

  await page.goForward();
  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&r=collaboration-mode:shared-workspace`,
  );
  await expect(summary).toBeFocused();
  await trigger.click();
  await expect(mobileFilters.getByLabel("Use Export formats as")).toHaveValue("required");

  if (testInfo.project.name === "chromium") {
    await dialog.getByRole("button", { name: "Apply filters" }).scrollIntoViewIfNeeded();
    await expect(dialog.getByRole("button", { name: "Apply filters" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Clear all" })).toBeVisible();
    await captureViewportScreenshot(page, testInfo, "decision-mobile-dialog", { width: 360, height: 800 });
  }
  await dialog.getByRole("button", { name: "Clear all" }).click();
  await expect(page).toHaveURL(writingPath);
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("2 tools in this Scenario");

  await page.goBack();
  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&r=collaboration-mode:shared-workspace`,
  );
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText(
    "No tools match every required condition",
  );
  await expect(trigger).toContainText("2 active");
  expect(await page.evaluate(() => window.name)).toBe("decision-history-marker");

  await page.goForward();
  await expect(page).toHaveURL(writingPath);
  await expect(summary.getByRole("heading", { level: 2 })).toHaveText("2 tools in this Scenario");
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("JavaScript-disabled Decision keeps the useful static projection", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  const baseURL = String(testInfo.project.use.baseURL);

  await page.goto(`${baseURL}${writingPath}?r=export-formats:pdf`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Writing assistants for small teams");
  await expect(page.getByText("Decision criteria", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Filters/ })).toBeHidden();
  await expect(page.locator('[data-decision-filter-form="desktop"]')).toBeHidden();
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText(
    "2 tools in this Scenario",
  );
  await expect(page.getByRole("link", { name: "View Tool details" })).toHaveCount(2);
  await expect(page.getByText("Evidence summary", { exact: true })).toHaveCount(2);
  await expectNoPageOverflow(page);
  await context.close();
});

test("controller failure leaves the static Decision projection available", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.route(`**${writingPath}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /data-decision-scenario="[^"]+"/,
      'data-decision-scenario="%7Bbroken"',
    );
    await route.fulfill({ response, body });
  });

  await page.goto(writingPath);
  await expect(page.getByText("Decision criteria", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Filters/ })).toBeHidden();
  await expect(page.locator('[data-decision-filter-form="desktop"]')).toBeHidden();
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText(
    "2 tools in this Scenario",
  );
  await expect(page.getByRole("link", { name: "View Tool details" })).toHaveCount(2);
  expect(pageErrors).toHaveLength(1);
  expect(pageErrors[0]).toContain("Decision controller failed; static projection remains available");
});

test("interaction failure restores the static projection without partial results", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.goto(writingPath);
  await page.locator('[data-candidate-state-label]').first().evaluate((element) => element.remove());

  await page.locator('[data-decision-filter-form="desktop"]')
    .getByLabel("Use Commercial use permitted as")
    .selectOption("required");

  await expect(page).toHaveURL(writingPath);
  await expect(page.getByText("Decision criteria", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Filters/ })).toBeHidden();
  await expect(page.locator('[data-decision-filter-form="desktop"]')).toBeHidden();
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText(
    "2 tools in this Scenario",
  );
  await expect(page.getByRole("link", { name: "View Tool details" })).toHaveCount(2);
  expect(pageErrors).toHaveLength(1);
  expect(pageErrors[0]).toContain("Decision controller failed; static projection remains available");
});
