import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4328";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "lifecycle-built.test.ts",
  outputDir: "./test-results/lifecycle",
  fullyParallel: false,
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
    command: "node tests/support/lifecycle-preview.ts",
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
  ],
});
