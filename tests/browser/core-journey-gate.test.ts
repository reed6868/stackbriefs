import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type { DomainScenario } from "../../src/domain/model";

import {
  assertNoSeriousAxeViolations,
  captureViewportScreenshot,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";

const writingPath = "/decision/writing-assistants";
const alphaToolPath = "/tool/alpha-writer";

async function mockOfficialDestination(context: BrowserContext) {
  await context.route("https://alpha.example/**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Alpha official fixture</title><h1>Alpha official fixture</h1>",
    });
  });
}

async function expectOfficialDestination(context: BrowserContext, activate: () => Promise<void>) {
  const popupPromise = context.waitForEvent("page");
  await activate();
  const officialPage = await popupPromise;
  await officialPage.waitForLoadState();
  await expect(officialPage).toHaveURL("https://alpha.example/");
  await expect(officialPage.getByRole("heading", { name: "Alpha official fixture" })).toBeVisible();
  await officialPage.close();
}

async function activateFromTabOrder(page: Page, target: ReturnType<Page["locator"]>, maxSteps = 100) {
  for (let step = 0; step < maxSteps; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      await page.keyboard.press("Enter");
      return;
    }
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
  await page.keyboard.press("Enter");
}

async function createZeroResultsThenRelax(page: Page, variant: "desktop" | "mobile") {
  const form = page.locator(`[data-decision-filter-form="${variant}"]`);
  await form.getByLabel("Commercial use permitted value").selectOption("false");
  await form.getByLabel("Use Commercial use permitted as").selectOption("required");
  if (variant === "mobile") {
    await page.getByRole("dialog", { name: "Filters" })
      .getByRole("button", { name: "Apply filters" }).tap();
  }
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText(
    "No tools match every required condition",
  );
  const relax = page.getByRole("button", { name: "Make Commercial use permitted optional" });
  if (variant === "mobile") await relax.tap();
  else await activateFromTabOrder(page, relax);
  await expect(page.locator("#result-summary").getByRole("heading", { level: 2 })).toHaveText(
    "2 tools match",
  );
}

test("keyboard journey reaches evidence and the neutral Official Link", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  await mockOfficialDestination(page.context());
  await page.goto("/");

  await activateFromTabOrder(
    page,
    page.getByRole("link", { name: "Writing assistants for small teams" }),
  );
  await expect(page).toHaveURL(writingPath);
  await createZeroResultsThenRelax(page, "desktop");

  await activateFromTabOrder(
    page,
    page.locator('[data-candidate-card="candidate-writing-alpha"]')
      .getByRole("button", { name: "Add Alpha Writer to shortlist" }),
  );
  await activateFromTabOrder(
    page,
    page.locator('[data-candidate-card="candidate-writing-bravo"]')
      .getByRole("button", { name: "Add Bravo Draft to shortlist" }),
  );
  await activateFromTabOrder(
    page,
    page.locator("[data-shortlist-dock]").getByRole("button", { name: "Compare shortlisted Tools" }),
  );

  const comparison = page.getByRole("region", { name: "Compare shortlisted Tools" });
  await expect(comparison).toBeVisible();
  await expect(comparison.getByRole("table")).toContainText("Verified fact");
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await captureViewportScreenshot(page, testInfo, "core-journey-comparison-keyboard", {
      width: 1440,
      height: 1000,
    });
  }

  await activateFromTabOrder(
    page,
    page.locator('[data-candidate-card="candidate-writing-alpha"]')
      .getByRole("link", { name: "View Tool details" }),
  );
  await expect(page).toHaveURL(new RegExp(`^http://127\\.0\\.0\\.1:4327${alphaToolPath}`));
  const evidenceDetails = page.getByText("Evidence details", { exact: true }).first();
  await activateFromTabOrder(page, evidenceDetails);
  await expect(page.locator('[data-link-type="evidence"]').first()).toBeVisible();
  await expect(page.locator('[data-link-type="official"]')).toBeVisible();
  await assertNoSeriousAxeViolations(page);

  await expectOfficialDestination(page.context(), async () => {
    await activateFromTabOrder(page, page.getByRole("link", { name: "Official Link" }));
  });
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("touch journey completes mobile Apply, shortlist, compare, evidence, and Official Link", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    colorScheme: "light",
    hasTouch: true,
    locale: "en-US",
    reducedMotion: "reduce",
    timezoneId: "America/Los_Angeles",
    viewport: { width: 360, height: 800 },
  });
  await mockOfficialDestination(context);
  const page = await context.newPage();
  const pageErrors = watchPageErrors(page);
  await page.goto("/");

  await page.getByRole("link", { name: "Writing assistants for small teams" }).tap();
  await page.getByRole("button", { name: /Filters/ }).tap();
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog).toBeVisible();
  await assertNoSeriousAxeViolations(page);
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => {
      const active = document.activeElement;
      if (!active || active === document.body || element.contains(active)) return true;
      return !active.matches("a, button, input, select, textarea, [tabindex]");
    })).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: /Filters/ })).toBeFocused();
  await page.getByRole("button", { name: /Filters/ }).tap();
  await createZeroResultsThenRelax(page, "mobile");
  await page.locator('[data-candidate-card="candidate-writing-alpha"]')
    .getByRole("button", { name: "Add Alpha Writer to shortlist" }).tap();
  await page.locator('[data-candidate-card="candidate-writing-bravo"]')
    .getByRole("button", { name: "Add Bravo Draft to shortlist" }).tap();
  await page.locator("[data-shortlist-dock]").getByRole("button", { name: "Compare shortlisted Tools" }).tap();
  await expect(page.getByRole("region", { name: "Compare shortlisted Tools" })).toBeVisible();

  await page.locator('[data-candidate-card="candidate-writing-alpha"]')
    .getByRole("link", { name: "View Tool details" }).tap();
  await page.getByText("Evidence details", { exact: true }).first().tap();
  await expect(page.locator('[data-link-type="evidence"]').first()).toBeVisible();
  await expectOfficialDestination(context, async () => {
    await page.getByRole("link", { name: "Official Link" }).tap();
  });

  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await captureViewportScreenshot(page, testInfo, "core-journey-tool-touch", {
      width: 360,
      height: 800,
    });
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  await context.close();
});

test("responsive matrix preserves reflow, long content, and critical information", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  const originalLimitation = "Fixture observations cover only the documented team plan.";
  const longLimitation = `Long verification context ${"remains fully visible and wrapped ".repeat(35)}`;
  await page.route(`**${writingPath}`, async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const encodedScenario = source.match(/data-decision-scenario="([^"]+)"/)?.[1];
    if (!encodedScenario) throw new Error("Long-content Gate fixture requires serialized Scenario data");
    const scenario = JSON.parse(decodeURIComponent(encodedScenario)) as DomainScenario;
    const expandedScenario = {
      ...scenario,
      candidates: scenario.candidates.map((candidate) => candidate.id === "candidate-writing-alpha"
        ? { ...candidate, limitation: longLimitation }
        : candidate),
    };
    const body = source
      .replace(encodedScenario, encodeURIComponent(JSON.stringify(expandedScenario)))
      .replaceAll(originalLimitation, longLimitation);
    await route.fulfill({ response, body });
  });
  const viewports = [
    { name: "reflow-320-css-px", width: 320, height: 800 },
    { name: "mobile", width: 360, height: 800 },
    { name: "tablet-portrait", width: 768, height: 1024 },
    { name: "tablet-landscape", width: 1024, height: 768 },
    { name: "desktop", width: 1440, height: 1000 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(writingPath);
    await expect(page.getByRole("heading", { level: 1, name: "Writing assistants for small teams" })).toBeVisible();
    await expect(page.locator('[data-candidate-card="candidate-writing-alpha"] [data-candidate-static-limitation]'))
      .toContainText(longLimitation);
    await expectNoPageOverflow(page);
    await page.goto(alphaToolPath);
    await expect(page.getByRole("link", { name: "Official Link" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Current evidence" })).toBeVisible();
    await expectNoPageOverflow(page);
    if (testInfo.project.name === "chromium" && ["reflow-320-css-px", "tablet-landscape"].includes(viewport.name)) {
      await captureViewportScreenshot(page, testInfo, `core-gate-${viewport.name}`, viewport);
    }
  }
  await assertNoSeriousAxeViolations(page);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("forced colors and reduced motion keep controls and evidence perceivable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Forced-colors emulation is verified in Chromium");
  const pageErrors = watchPageErrors(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto(writingPath);

  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) =>
    animation.playState === "running").length)).toBe(0);
  expect(await page.locator(".menu-button").evaluate((button) => {
    const bar = button.querySelector("span");
    if (!bar) return false;
    const surface = getComputedStyle(button).backgroundColor;
    return [
      getComputedStyle(bar).backgroundColor,
      getComputedStyle(bar, "::before").backgroundColor,
      getComputedStyle(bar, "::after").backgroundColor,
    ].every((color) => color !== surface);
  })).toBe(true);
  await expect(page.getByRole("button", { name: /Filters/ })).toBeVisible();
  await expect(page.getByText("Verified fact", { exact: true }).first()).toBeVisible();
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  await captureViewportScreenshot(page, testInfo, "core-gate-forced-colors", { width: 360, height: 800 });
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("Tool evidence and Official Link remain useful without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  await mockOfficialDestination(context);
  const page = await context.newPage();
  await page.goto(alphaToolPath);

  await expect(page.getByRole("heading", { level: 1, name: "Alpha Writer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Current evidence" })).toBeVisible();
  await expect(page.getByText("Verified fact", { exact: true })).toHaveCount(3);
  await expectNoPageOverflow(page);
  await expectOfficialDestination(context, async () => {
    await page.getByRole("link", { name: "Official Link" }).click();
  });
  await context.close();
});
