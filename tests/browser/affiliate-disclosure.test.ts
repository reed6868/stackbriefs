import { expect, test } from "@playwright/test";

import { matchingProhibitedAffiliateDisclosureClaims } from "../affiliate-disclosure-policy";
import {
  activateWithKeyboard,
  assertNoSeriousAxeViolations,
  captureResponsiveScreenshots,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";

const disclosurePath = "/affiliate-disclosure";

test("Affiliate disclosure renders the commercial-boundary contract", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  await page.goto(disclosurePath);

  await expect(page).toHaveTitle("Affiliate disclosure | StackBriefs");
  await expect(page.getByRole("heading", { level: 1, name: "Affiliate disclosure" })).toBeVisible();
  await expect(page.getByText("Last reviewed 2026-07-17", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Affiliate disclosure" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Affiliate disclosure" })).toHaveAttribute("aria-current", "page");

  const contents = page.getByRole("navigation", { name: "On this page" });
  await expect(contents.getByRole("link")).toHaveCount(6);
  await activateWithKeyboard(page, contents.getByRole("link", { name: "Three link types" }));
  await expect(page).toHaveURL(`${disclosurePath}#three-link-types`);

  const linkReference = page.getByRole("region", { name: "Outbound link reference" });
  await expect(linkReference.getByRole("table")).toBeVisible();
  await expect(linkReference.getByRole("columnheader")).toHaveCount(3);
  await expect(linkReference.getByRole("row")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Methodology" }).last())
    .toHaveAttribute("href", "/methodology");

  const disclosureText = await page.locator("article.trusted-content").innerText();
  expect(matchingProhibitedAffiliateDisclosureClaims(disclosureText)).toEqual([]);
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await page.goto(disclosurePath);
    await captureResponsiveScreenshots(page, testInfo, "affiliate-disclosure");
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("a qualifying Offer exposes nearby disclosure while Official Link stays independent", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-07-17T12:00:00Z"));
  await page.goto("/tool/charlie-meet");

  await expect(page.getByRole("link", { name: "Official Link" })).toBeVisible();
  const offer = page.locator("[data-tool-offer]");
  await expect(offer).toBeVisible();
  const disclosureLink = offer.getByRole("link", { name: "Read the Affiliate disclosure" });
  await expect(disclosureLink).toHaveAttribute("href", disclosurePath);
  await disclosureLink.click();
  await expect(page).toHaveURL(disclosurePath);
  await expect(page.getByRole("heading", { level: 1, name: "Affiliate disclosure" })).toBeVisible();
});

test("Affiliate disclosure remains useful without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    javaScriptEnabled: false,
    viewport: { width: 360, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(disclosurePath);

  await expect(page.getByRole("heading", { level: 1, name: "Affiliate disclosure" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three link types" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "When an Offer appears" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Commercial neutrality" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Outbound link reference" })).toBeVisible();
  await expectNoPageOverflow(page);
  await context.close();
});
