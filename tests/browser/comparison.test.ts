import { expect, test } from "@playwright/test";

import {
  assertNoSeriousAxeViolations,
  captureViewportScreenshot,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";
import { expandWritingScenario } from "./expanded-writing-fixture";

const writingPath = "/decision/writing-assistants";

test("Compare opens with pushState, updates eligibility, and Back restores focus", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  await page.goto(writingPath);
  const dock = page.locator("[data-shortlist-dock]");
  const comparison = page.locator("[data-comparison-section]");
  const heading = comparison.getByRole("heading", { name: "Compare shortlisted Tools" });
  const historyLength = await page.evaluate(() => history.length);

  await page.locator('[data-candidate-card="candidate-writing-alpha"]')
    .getByRole("button", { name: "Add Alpha Writer to shortlist" }).click();
  await page.locator('[data-candidate-card="candidate-writing-bravo"]')
    .getByRole("button", { name: "Add Bravo Draft to shortlist" }).click();
  const compare = dock.getByRole("button", { name: "Compare shortlisted Tools" });
  await compare.click();

  await expect(page).toHaveURL(`${writingPath}?shortlist=alpha-writer,bravo-draft#comparison`);
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
  await expect(comparison).toBeVisible();
  await expect(heading).toBeFocused();
  const table = comparison.getByRole("table", {
    name: "Comparison of shortlisted Tools for Writing assistants for small teams",
  });
  await expect(table.getByRole("columnheader", { name: /Alpha Writer/ })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: /Bravo Draft/ })).toBeVisible();
  await expect(table.getByRole("rowheader", { name: "Commercial use permitted" })).toBeVisible();
  await expect(table.getByRole("rowheader", { name: "Limitation" })).toBeVisible();
  await expect(table).not.toContainText(/winner|best|score|rank/i);

  const filters = page.locator('[data-decision-filter-form="desktop"]');
  await filters.getByLabel("Export formats value").selectOption("pdf");
  const exportMode = filters.getByLabel("Use Export formats as");
  await exportMode.focus();
  await exportMode.selectOption("required");
  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&shortlist=alpha-writer,bravo-draft#comparison`,
  );
  await expect(exportMode).toBeFocused();
  await expect(table.getByRole("columnheader", { name: /Alpha Writer/ })).toContainText(
    "No longer matches required conditions",
  );

  if (testInfo.project.name === "chromium") {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await comparison.evaluate((element) => element.scrollIntoView({ block: "start" }));
    await captureViewportScreenshot(page, testInfo, "comparison-desktop", { width: 1440, height: 1000 });
    await page.setViewportSize({ width: 768, height: 900 });
    await comparison.evaluate((element) => element.scrollIntoView({ block: "start" }));
    await captureViewportScreenshot(page, testInfo, "comparison-tablet", { width: 768, height: 900 });
  }

  await page.goBack();
  await expect(page).toHaveURL(`${writingPath}?shortlist=alpha-writer,bravo-draft`);
  await expect(comparison).toBeHidden();
  await expect(compare).toBeFocused();

  await page.goForward();
  await expect(page).toHaveURL(
    `${writingPath}?r=export-formats:pdf&shortlist=alpha-writer,bravo-draft#comparison`,
  );
  await expect(comparison).toBeVisible();
  await expect(heading).toBeFocused();

  await dock.locator('[data-shortlist-item="alpha-writer"]')
    .getByRole("button", { name: "Remove Alpha Writer from shortlist" }).click();
  await expect(page).toHaveURL(`${writingPath}?r=export-formats:pdf&shortlist=bravo-draft`);
  await expect(comparison).toBeHidden();
  await expect(dock.locator('[data-shortlist-item="bravo-draft"]')
    .getByRole("button", { name: "Remove Bravo Draft from shortlist" })).toBeFocused();
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("invalid comparison fragment is normalized away below two Tools", async ({ page }) => {
  await page.goto(`${writingPath}?shortlist=alpha-writer#comparison`);

  await expect(page).toHaveURL(`${writingPath}?shortlist=alpha-writer`);
  await expect(page.locator("[data-comparison-section]")).toBeHidden();
  await expect(page.locator("[data-shortlist-dock]")
    .getByRole("button", { name: "Compare shortlisted Tools" })).toBeDisabled();
});

test("four-Tool mobile comparison contains scrolling and keeps unknowns and limitations", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date("2030-01-01T12:00:00Z"));
  const pageErrors = watchPageErrors(page);
  await page.route(`**${writingPath}*`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: expandWritingScenario(await response.text()) });
  });
  await page.goto(
    `${writingPath}?shortlist=alpha-writer,bravo-draft,charlie-compose,delta-write#comparison`,
  );
  const comparison = page.locator("[data-comparison-section]");
  const table = comparison.getByRole("table");
  const region = comparison.getByRole("region", { name: "Compare shortlisted Tools" });

  await expect(comparison).toBeVisible();
  await expect(table.getByRole("columnheader")).toHaveCount(5);
  for (const name of ["Alpha Writer", "Bravo Draft", "Charlie Compose", "Delta Write"]) {
    await expect(table.getByRole("columnheader", { name: new RegExp(name) })).toBeVisible();
  }
  await expect(table.getByRole("rowheader")).toHaveCount(4);
  await expect(table.getByText("Needs recheck", { exact: true })).toHaveCount(12);
  await expect(table.getByText("No current value", { exact: true })).toHaveCount(12);
  const limitationRow = table.getByRole("row", { name: /Limitation/ });
  await expect(limitationRow.getByRole("cell")).toHaveCount(4);
  const overflow = await region.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await comparison.evaluate((element) => element.scrollIntoView({ block: "start" }));
    await captureViewportScreenshot(page, testInfo, "comparison-mobile", { width: 360, height: 800 });
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});
