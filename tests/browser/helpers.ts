import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const screenshotViewports = [
  { width: 360, height: 800 },
  { width: 768, height: 900 },
  { width: 1440, height: 1000 },
] as const;

export function watchPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

export async function activateWithKeyboard(page: Page, target: Locator) {
  await target.focus();
  await expect(target).toBeFocused();
  await page.keyboard.press("Enter");
}

export async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `document scrollWidth ${dimensions.scrollWidth}px exceeds clientWidth ${dimensions.clientWidth}px`,
  ).toBeLessThanOrEqual(dimensions.clientWidth);
}

export async function assertNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  const details = violations
    .map((violation) =>
      [
        `${violation.id}: ${violation.help}`,
        ...violation.nodes.map(
          (node) => `  ${node.target.join(" ")}: ${node.failureSummary ?? "failed"}`,
        ),
      ].join("\n"),
    )
    .join("\n");
  expect(violations, details).toEqual([]);
}

export async function captureResponsiveScreenshots(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  for (const viewport of screenshotViewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expectNoPageOverflow(page);
    const path = testInfo.outputPath(`${name}-${viewport.width}.png`);
    await page.screenshot({
      path,
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await testInfo.attach(`${name}-${viewport.width}`, { path, contentType: "image/png" });
  }
}

export async function captureViewportScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expectNoPageOverflow(page);
  const path = testInfo.outputPath(`${name}-${viewport.width}.png`);
  await page.screenshot({ path, fullPage: false, animations: "disabled", caret: "hide" });
  await testInfo.attach(`${name}-${viewport.width}`, { path, contentType: "image/png" });
}
