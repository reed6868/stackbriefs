# Browser test harness

SB-207 adds a development-only Playwright and axe harness for the static Home-to-Decision flow.

## Dependencies

| Package | Version | Maintenance and purpose | License | Production impact |
| --- | --- | --- | --- | --- |
| `@playwright/test` | `1.61.1` | Maintained by Microsoft; browser runner, lifecycle, screenshots, and Chromium/WebKit/Firefox projects | Apache-2.0 | Dev dependency only; no client runtime or production bundle code |
| `@axe-core/playwright` | `4.12.1` | Maintained by Deque; runs axe-core against Playwright pages | MPL-2.0 | Dev dependency only; injected only while tests run |

Playwright browser binaries are installed into the local or CI browser cache. They are not copied into `dist`.

## Commands

- `npx playwright install --with-deps chromium webkit firefox` installs the required local browser engines and host libraries.
- `npm run test:browser:smoke` runs the focused Chromium Home-to-Decision smoke.
- `npm run test:browser:core` runs all browser tests in Chromium and WebKit.
- `npm run test:browser:firefox` runs the bounded Firefox route smoke.
- `npm run test:browser` runs the configured Chromium, WebKit, and bounded Firefox projects.

The Playwright `webServer` builds the static site, starts Astro Preview on `127.0.0.1:4327`, and owns shutdown. Preview avoids development HMR reloads and exercises the generated static output. Successful Chromium runs attach deterministic full-page screenshots at 360, 768, and 1440 CSS pixels under the ignored `test-results/` directory.
