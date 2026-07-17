import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = 4327;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run preview -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "firefox-smoke",
      testMatch: "**/home-to-decision.test.ts",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
