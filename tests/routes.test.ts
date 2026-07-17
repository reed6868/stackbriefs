import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

import StatusPage from "../src/components/StatusPage.astro";
import BaseLayout from "../src/layouts/BaseLayout.astro";

const routePaths = [
  "../src/pages/index.astro",
  "../src/pages/decision/[scenario].astro",
  "../src/pages/tool/[slug].astro",
  "../src/pages/methodology.astro",
  "../src/pages/affiliate-disclosure.astro",
  "../src/pages/404.astro",
] as const;

const fixturePlaceholderRoutePaths = [
  "../src/pages/index.astro",
] as const;
const execFileAsync = promisify(execFile);

describe("P0 route skeleton", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it("defines every required route with one H1 and the shared layout", async () => {
    const routes = await Promise.all(
      routePaths.map(async (path) => [path, await readFile(new URL(path, import.meta.url), "utf8")] as const),
    );

    for (const [path, source] of routes) {
      expect(source, `${path} uses BaseLayout`).toContain("<BaseLayout");

      if (path.endsWith("404.astro")) {
        expect(source).toContain("<StatusPage");
      } else if (path.includes("decision/")) {
        expect(source).toContain("<DecisionWorkspace");
      } else if (path.includes("tool/")) {
        expect(source).toContain("<ToolDetail");
      } else {
        expect(source.match(/<h1(?:\s|>)/g), `${path} has one H1`).toHaveLength(1);
      }
    }
  });

  it("marks remaining non-production route placeholders as fixtures", async () => {
    const routes = await Promise.all(
      fixturePlaceholderRoutePaths.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

    for (const source of routes) {
      expect(source).toContain("data-fixture");
      expect(source).toContain("Fixture preview");
    }
  });

  it("configures the production site, slash policy, and permanent Cloudflare redirect", async () => {
    const [config, redirects] = await Promise.all([
      readFile(new URL("../astro.config.mjs", import.meta.url), "utf8"),
      readFile(new URL("../public/_redirects", import.meta.url), "utf8"),
    ]);

    expect(config).toContain('site: "https://stackbriefs.pages.dev"');
    expect(config).toContain('trailingSlash: "never"');
    expect(config).toMatch(/build:\s*{[\s\S]*format:\s*"file"/);
    expect(config).toContain("lifecycleRedirects");
    expect(redirects.trim()).toBe("/decision /#scenarios 301");
  });

  it("builds slashless routes as HTML files", async () => {
    const root = fileURLToPath(new URL("..", import.meta.url));

    await execFileAsync("npm", ["run", "build"], { cwd: root });

    const builtFiles = [
      "../dist/index.html",
      "../dist/404.html",
      "../dist/methodology.html",
      "../dist/affiliate-disclosure.html",
      "../dist/decision/meeting-assistants.html",
      "../dist/decision/writing-assistants.html",
      "../dist/tool/alpha-writer.html",
      "../dist/tool/bravo-draft.html",
      "../dist/tool/charlie-meet.html",
      "../dist/tool/delta-notes.html",
      "../dist/_redirects",
    ];

    await Promise.all(builtFiles.map((path) => access(new URL(path, import.meta.url))));
    await expect(access(new URL("../dist/methodology/index.html", import.meta.url))).rejects.toThrow();

    const [meetingDecision, writingDecision, tool] = await Promise.all([
      readFile(new URL("../dist/decision/meeting-assistants.html", import.meta.url), "utf8"),
      readFile(new URL("../dist/decision/writing-assistants.html", import.meta.url), "utf8"),
      readFile(new URL("../dist/tool/alpha-writer.html", import.meta.url), "utf8"),
    ]);

    for (const decision of [meetingDecision, writingDecision]) {
      expect(decision).not.toContain('href="/tool/fixture-tool"');
      expect(decision).toContain('href="/#scenarios"');
      expect(decision).toContain("Decision criteria");
      expect(decision).toContain("Evidence summary");
      expect(decision).toContain("Suitable for");
      expect(decision).toContain("Not suitable for");
      expect(decision).not.toContain("Route skeleton");
    }
    expect(tool).toContain("Where this Tool is evaluated");
    expect(tool).toContain('href="/decision/writing-assistants"');
    expect(tool).toContain("Official Link");
    expect(tool).not.toContain("Route skeleton");
  }, 20_000);

  it("renders noindex metadata for status layouts", async () => {
    const html = await container.renderToString(BaseLayout, {
      props: {
        title: "Unavailable | StackBriefs",
        description: "Unavailable page",
        noindex: true,
      },
      request: new Request("https://stackbriefs.test/missing"),
      slots: { default: "<h1>Unavailable</h1>" },
    });

    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  it.each(["unavailable", "blocked", "retired"] as const)(
    "renders truthful %s recovery content without decision controls",
    async (status) => {
      const html = await container.renderToString(StatusPage, {
        props: {
          status,
          title: status === "retired" ? "This page has retired" : "This page is unavailable",
          message: "This fixture status explains what happened without presenting current claims.",
        },
      });

      expect(html).toContain(`data-status="${status}"`);
      expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1);
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/#scenarios"');
      expect(html).toContain('href="/methodology"');
      expect(html.toLowerCase()).not.toMatch(/filter|compare|shortlist|official link/);
    },
  );
});
