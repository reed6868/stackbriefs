import { expect, test } from "@playwright/test";

import {
  activateWithKeyboard,
  assertNoSeriousAxeViolations,
  captureResponsiveScreenshots,
  expectNoPageOverflow,
  watchPageErrors,
} from "./helpers";

const methodologyPath = "/methodology";

test("Methodology renders accurate, navigable trust content", async ({ page }, testInfo) => {
  const pageErrors = watchPageErrors(page);
  await page.goto(methodologyPath);

  await expect(page).toHaveTitle("Methodology | StackBriefs");
  await expect(page.getByRole("heading", { level: 1, name: "Methodology" })).toBeVisible();
  await expect(page.getByText("Last reviewed 2026-07-17", { exact: true })).toBeVisible();
  const contents = page.getByRole("navigation", { name: "On this page" });
  await expect(contents.getByRole("link")).toHaveCount(9);
  await activateWithKeyboard(page, contents.getByRole("link", { name: "Evidence states" }));
  await expect(page).toHaveURL(`${methodologyPath}#evidence-states`);
  await expect(page.getByRole("heading", { name: "Evidence states" })).toBeVisible();

  const stateReference = page.getByRole("region", { name: "Evidence state reference" });
  await expect(stateReference.getByRole("table")).toBeVisible();
  await expect(stateReference.getByRole("columnheader")).toHaveCount(2);
  await expect(stateReference.getByRole("row")).toHaveCount(7);
  await expect(page.getByRole("link", { name: "writing assistants Decision" }))
    .toHaveAttribute("href", "/decision/writing-assistants");
  await expect(page.getByRole("link", { name: "Affiliate disclosure" }).last())
    .toHaveAttribute("href", "/affiliate-disclosure");
  await expect(page.getByText(/winner|best tool|top-ranked|ranking score/i)).toHaveCount(0);

  for (const path of ["/decision/writing-assistants", "/affiliate-disclosure"]) {
    expect((await page.request.get(path)).status()).toBe(200);
  }
  await expectNoPageOverflow(page);
  await assertNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium") {
    await page.goto(methodologyPath);
    await captureResponsiveScreenshots(page, testInfo, "methodology");
  }
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("Methodology remains useful without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    javaScriptEnabled: false,
    viewport: { width: 360, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(methodologyPath);

  await expect(page.getByRole("heading", { level: 1, name: "Methodology" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Required conditions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Commercial neutrality" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Evidence state reference" })).toBeVisible();
  await expect(page.getByRole("link", { name: "writing assistants Decision" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Affiliate disclosure" }).last()).toBeVisible();
  await expectNoPageOverflow(page);
  await context.close();
});
