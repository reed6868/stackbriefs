import { expect, test } from "@playwright/test";

import {
  assertNoSeriousAxeViolations,
  captureResponsiveScreenshots,
  captureViewportScreenshot,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";

const decisionPath = "/decision/writing-assistants";
const toolPath = "/tool/alpha-writer";
const offerToolPath = "/tool/charlie-meet";

test("Scenario entry preserves validated Decision state and context", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  const decisionUrl = `${decisionPath}?p=export-formats:pdf&shortlist=alpha-writer,bravo-draft#comparison`;
  await page.goto(decisionUrl);

  const details = page.locator('[data-candidate-card="candidate-writing-alpha"]')
    .getByRole("link", { name: "View Tool details" });
  await expect(details).toHaveAttribute("href", new RegExp(
    `^${toolPath}\\?scenario=writing-assistants&return=`,
  ));
  await details.click();

  await expect(page).toHaveURL(new RegExp(`^http://127\\.0\\.0\\.1:4327${toolPath}\\?`));
  await expect(page).toHaveTitle("Alpha Writer | StackBriefs");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Writing assistants for small teams" })).toBeVisible();
  await expect(breadcrumb.getByText("Alpha Writer", { exact: true })).toBeVisible();
  const context = page.locator('[data-tool-context="writing-assistants"]');
  await expect(context).toHaveAttribute("data-active-context", "true");
  await expect(context.getByText("Fixture observations cover only the documented team plan.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Official Link" })).toHaveAttribute(
    "href",
    "https://alpha.example/",
  );

  const returnLink = page.locator("[data-tool-return]");
  await expect(returnLink).toBeVisible();
  await returnLink.click();
  await expect(page).toHaveURL(`http://127.0.0.1:4327${decisionUrl}`);
  await expect(page.locator("[data-comparison-section]")).toBeVisible();

  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await page.goBack();
    await captureViewportScreenshot(page, testInfo, "tool-detail-scenario-desktop", {
      width: 1440,
      height: 1000,
    });
    await captureViewportScreenshot(page, testInfo, "tool-detail-scenario-tablet", {
      width: 768,
      height: 900,
    });
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("direct mobile entry keeps identity neutral and uses the Logo fallback", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const pageErrors = watchPageErrors(page);
  await page.goto(toolPath);

  await expect(page).toHaveTitle("Alpha Writer | StackBriefs");
  await expect(page.getByRole("heading", { level: 1, name: "Alpha Writer" })).toBeVisible();
  await expect(page.locator("[data-tool-return]")).toBeHidden();
  await expect(page.locator("[data-tool-scenario-breadcrumb]")).toBeHidden();
  const fallback = page.locator("[data-tool-logo-fallback]");
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveText("AW");
  await expect(page.getByRole("heading", { name: "Where this Tool is evaluated" })).toBeVisible();
  await expect(page.getByText("Partially tested", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Verify before using" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Current evidence" })).toBeVisible();
  await expect(page.locator("[data-tool-claim]")).toHaveCount(3);
  await expect(page.getByText("Verified fact", { exact: true })).toHaveCount(3);
  await expect(page.locator('[data-link-type="evidence"]')).toHaveCount(3);
  await expect(page.locator("[data-tool-offer]")).toHaveCount(0);
  await expect(page.getByText(/winner|best overall|score|rank/i)).toHaveCount(0);

  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await captureViewportScreenshot(page, testInfo, "tool-detail-direct-mobile", {
      width: 360,
      height: 800,
    });
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("qualifying Affiliate Offer stays separate from Official and Evidence links", async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-07-17T12:00:00Z"));
  const pageErrors = watchPageErrors(page);
  await page.goto(offerToolPath);

  const official = page.locator('[data-link-type="official"]');
  const evidence = page.locator('[data-link-type="evidence"]');
  const offer = page.locator("[data-tool-offer]");
  const offerLink = page.locator('[data-link-type="offer"]');
  await expect(official).toBeVisible();
  await expect(official).toHaveAttribute("rel", "noopener noreferrer");
  await expect(evidence.first()).toHaveAttribute("rel", "noopener noreferrer");
  await expect(offer).toBeVisible();
  await expect(offer).toContainText("Affiliate Offer");
  await expect(offer).toContainText("Verified deal");
  await expect(offer).toContainText("20% off the documented business plan");
  await expect(offer).toContainText("StackBriefs may receive compensation");
  await expect(offerLink).toHaveAttribute("rel", "noopener sponsored");
  await expect(offerLink).toHaveAttribute("target", "_blank");

  await page.getByText("Evidence details", { exact: true }).first().click();
  await expect(evidence.first()).toBeVisible();
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await captureResponsiveScreenshots(page, testInfo, "tool-detail-affiliate-offer");
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("browser expiry downgrades Claims and hides an expired Affiliate Offer", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2030-01-01T12:00:00Z"));
  const pageErrors = watchPageErrors(page);
  await page.goto(offerToolPath);

  await expect(page.locator("[data-tool-claim]").getByText("Needs recheck", { exact: true })).toHaveCount(4);
  await expect(page.locator("[data-tool-claim]").getByText("No current value", { exact: true })).toHaveCount(4);
  await expect(page.locator('.evidence-badge:visible', { hasText: "Verified fact" })).toHaveCount(0);
  await expect(page.locator("[data-evidence-explanation]").first()).toContainText(
    "browser downgrade requires recheck",
  );
  await expect(page.locator("[data-tool-offer]")).toBeHidden();
  await expect(page.locator('[data-link-type="offer"]')).toBeHidden();
  await expect(page.locator('[data-link-type="official"]')).toBeVisible();
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("cross-origin return input falls back to the validated Scenario route", async ({ page }) => {
  await page.goto(`${toolPath}?scenario=writing-assistants&return=https://attacker.example/steal`);

  await expect(page.locator("[data-tool-return]")).toHaveAttribute(
    "href",
    "/decision/writing-assistants",
  );
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Writing assistants for small teams" })).toHaveAttribute(
    "href",
    "/decision/writing-assistants",
  );
});

test("broken Logo preserves the same readable identity footprint", async ({ page }) => {
  await page.route(`**${toolPath}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      '<span data-tool-logo-fallback>AW</span>',
      '<img src="/missing-tool-logo.svg" alt="Broken Alpha logo" width="72" height="72" data-tool-logo-image><span data-tool-logo-fallback hidden>AW</span>',
    );
    await route.fulfill({ response, body });
  });
  await page.goto(toolPath);

  await expect(page.locator("[data-tool-logo-image]")).toBeHidden();
  const fallback = page.locator("[data-tool-logo-fallback]");
  await expect(fallback).toBeVisible();
  expect(await fallback.evaluate((element) => ({
    width: element.parentElement?.getBoundingClientRect().width,
    height: element.parentElement?.getBoundingClientRect().height,
  }))).toEqual({ width: 72, height: 72 });
});

test("invalid Tool slug remains a 404", async ({ page }) => {
  const response = await page.goto("/tool/not-a-real-tool");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "This page is unavailable" })).toBeVisible();
});
