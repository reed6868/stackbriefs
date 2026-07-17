import { expect, test, type Page } from "@playwright/test";

import {
  assertNoSeriousAxeViolations,
  captureResponsiveScreenshots,
  captureViewportScreenshot,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";
import type { ToolDetailProjection } from "../../src/domain/tool-detail";

const decisionPath = "/decision/writing-assistants";
const toolPath = "/tool/alpha-writer";

function injectQualifyingOffer(html: string) {
  const projectionMatch = html.match(/data-tool-projection="([^"]+)"/);
  if (!projectionMatch) throw new Error("Tool detail fixture requires a serialized projection");
  const detail = JSON.parse(decodeURIComponent(projectionMatch[1]!)) as ToolDetailProjection;
  detail.offer = {
    id: "offer-alpha-browser",
    status: "verified_deal",
    statusLabel: "Verified deal",
    affiliateUrl: "https://offers.example/alpha",
    terms: "20% off the documented team plan for the first billing period.",
    region: "global",
    lastCheckedAt: "2026-07-16",
    validThrough: "2026-07-23",
    evidence: {
      state: "verified_fact",
      value: "verified_deal",
      authority: "primary",
      sourceIds: ["source-offer-alpha-status"],
      freshnessWindowDays: 7,
      resolvedAt: "2026-07-17",
      validThrough: "2026-07-23",
      explanation: "Current qualifying evidence agrees on the Offer status",
    },
    sources: [{
      id: "source-offer-alpha-status",
      sourceType: "official_pricing",
      sourceUrl: "https://offers.example/alpha/status",
      lastCheckedAt: "2026-07-16",
      scope: { region: "global" },
    }],
  };
  const encodedProjection = encodeURIComponent(JSON.stringify(detail));
  const offerMarkup = `
    <aside class="tool-offer" aria-labelledby="tool-offer-title" data-tool-offer>
      <p class="fixture-label">Optional commercial path</p>
      <div class="tool-offer__heading"><div><h2 id="tool-offer-title">Affiliate Offer</h2><p>Verified deal</p></div><span class="evidence-badge" data-evidence-state="verified_fact">Verified fact</span></div>
      <p class="tool-offer__terms">20% off the documented team plan for the first billing period.</p>
      <dl class="tool-offer__meta"><div><dt>Region</dt><dd>global</dd></div><div><dt>Checked</dt><dd><time datetime="2026-07-16">2026-07-16</time></dd></div></dl>
      <p class="tool-offer__evidence">Status evidence: <a href="https://offers.example/alpha/status" data-link-type="evidence" target="_blank" rel="noopener noreferrer">Source</a></p>
      <a class="primary-button tool-offer__cta" href="https://offers.example/alpha" data-link-type="offer" target="_blank" rel="noopener sponsored">View Affiliate Offer</a>
      <p class="tool-offer__disclosure">StackBriefs may receive compensation if you use this link. Commercial data never affects eligibility or ordering. <a href="/affiliate-disclosure">Read the Affiliate disclosure</a>.</p>
    </aside>`;
  return html
    .replace(projectionMatch[1]!, encodedProjection)
    .replace("</article>", `${offerMarkup}</article>`);
}

async function serveQualifyingOffer(page: Page) {
  await page.route(`**${toolPath}`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: injectQualifyingOffer(await response.text()) });
  });
}

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
  await serveQualifyingOffer(page);
  await page.goto(toolPath);

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
  await expect(offer).toContainText("20% off the documented team plan");
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
  await serveQualifyingOffer(page);
  await page.goto(toolPath);

  await expect(page.locator("[data-tool-claim]").getByText("Needs recheck", { exact: true })).toHaveCount(3);
  await expect(page.locator("[data-tool-claim]").getByText("No current value", { exact: true })).toHaveCount(3);
  await expect(page.locator('.evidence-badge:visible', { hasText: "Verified fact" })).toHaveCount(0);
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
