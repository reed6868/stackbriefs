import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

import LifecycleStatusPage from "../src/components/LifecycleStatusPage.astro";
import type { LifecycleStatusRoute } from "../src/domain/lifecycle-routes";

describe("lifecycle status page", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it.each([
    ["blocked", "Example Scenario is temporarily unavailable"],
    ["retired", "Example Scenario has retired"],
  ] as const)("renders a truthful noindex %s page without current decision content", async (status, heading) => {
    const route: LifecycleStatusRoute = {
      kind: "status",
      status,
      noindex: true,
      documentTitle: `${heading} | StackBriefs`,
      description: "Lifecycle status page",
      heading,
      message: "Previous content is withheld. Use a recovery path below.",
      breadcrumbLabel: "Example Scenario",
    };
    const html = await container.renderToString(LifecycleStatusPage, {
      props: { route },
      request: new Request("https://stackbriefs.test/decision/example"),
    });

    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).toContain(`data-status="${status}"`);
    expect(html).toContain(heading);
    expect(html).toContain('aria-label="Recovery"');
    expect(html.toLowerCase()).not.toMatch(/decision criteria|current evidence|filter|compare|shortlist|official link/);
  });
});
