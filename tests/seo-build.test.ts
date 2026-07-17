import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  buildLifecycleProject,
  createLifecycleProject,
  removeLifecycleProject,
} from "./support/lifecycle-project";

const execFileAsync = promisify(execFile);

describe("SEO build output", () => {
  let productionRoot = "";
  let productionOutput = "";
  let previewOutput = "";

  beforeAll(async () => {
    productionRoot = await createLifecycleProject();
    productionOutput = join(productionRoot, "dist");
    previewOutput = await mkdtemp(join(tmpdir(), "stackbriefs-seo-preview-"));
    await buildLifecycleProject(productionRoot);
    await execFileAsync("npx", ["astro", "build", "--outDir", previewOutput], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: {
        ...process.env,
        STACKBRIEFS_BUILD_TARGET: "preview",
        STACKBRIEFS_BUILD_DATE: "2026-07-17",
      },
      timeout: 120_000,
    });
  }, 120_000);

  afterAll(async () => {
    await Promise.all([
      removeLifecycleProject(productionRoot),
      rm(previewOutput, { recursive: true, force: true }),
    ]);
  });

  it("publishes only eligible routes in sitemap and robots output", async () => {
    const [sitemapIndex, sitemap, robots] = await Promise.all([
      readFile(join(productionOutput, "sitemap-index.xml"), "utf8"),
      readFile(join(productionOutput, "sitemap-0.xml"), "utf8"),
      readFile(join(productionOutput, "robots.txt"), "utf8"),
    ]);

    expect(sitemapIndex).toContain("https://stackbriefs.pages.dev/sitemap-0.xml");
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual([
      "https://stackbriefs.pages.dev",
      "https://stackbriefs.pages.dev/affiliate-disclosure",
      "https://stackbriefs.pages.dev/decision/meeting-assistants",
      "https://stackbriefs.pages.dev/methodology",
      "https://stackbriefs.pages.dev/tool/charlie-meet",
      "https://stackbriefs.pages.dev/tool/delta-notes",
      "https://stackbriefs.pages.dev/tool/echo-minutes",
    ]);
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://stackbriefs.pages.dev/sitemap-index.xml");
  });

  it("renders canonical, social, and approved structured metadata only on indexable pages", async () => {
    const [decision, tool, retired, blocked, notFound] = await Promise.all([
      readFile(join(productionOutput, "decision/meeting-assistants.html"), "utf8"),
      readFile(join(productionOutput, "tool/echo-minutes.html"), "utf8"),
      readFile(join(productionOutput, "tool/alpha-writer.html"), "utf8"),
      readFile(join(productionOutput, "tool/bravo-draft.html"), "utf8"),
      readFile(join(productionOutput, "404.html"), "utf8"),
    ]);

    expect(decision).toContain('<link rel="canonical" href="https://stackbriefs.pages.dev/decision/meeting-assistants">');
    expect(decision).toContain('<meta property="og:title"');
    expect(decision).toContain('<meta name="twitter:card" content="summary">');
    expect(decision).toContain('type="application/ld+json"');
    expect(decision).toContain('"@type":"BreadcrumbList"');
    expect(tool).toContain('"@type":"SoftwareApplication"');
    const toolStructuredData = tool.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    expect(toolStructuredData).toBeDefined();
    const toolGraph = JSON.parse(toolStructuredData!)["@graph"] as Array<Record<string, unknown>>;
    const softwareApplication = toolGraph.find((node) => node["@type"] === "SoftwareApplication");
    expect(Object.keys(softwareApplication ?? {})).toEqual([
      "@type",
      "@id",
      "name",
      "description",
      "url",
      "sameAs",
      "mainEntityOfPage",
    ]);
    for (const status of [retired, blocked, notFound]) {
      expect(status).toContain('<meta name="robots" content="noindex, nofollow">');
      expect(status).not.toContain('rel="canonical"');
      expect(status).not.toContain('type="application/ld+json"');
    }
  });

  it("keeps indexable titles, descriptions, and canonicals unique", async () => {
    const files = [
      "index.html",
      "methodology.html",
      "affiliate-disclosure.html",
      "decision/meeting-assistants.html",
      "tool/charlie-meet.html",
      "tool/delta-notes.html",
      "tool/echo-minutes.html",
    ];
    const pages = await Promise.all(files.map((file) => readFile(join(productionOutput, file), "utf8")));
    const values = pages.map((page) => ({
      title: page.match(/<title>([^<]+)<\/title>/)?.[1],
      description: page.match(/<meta name="description" content="([^"]+)">/)?.[1],
      canonical: page.match(/<link rel="canonical" href="([^"]+)">/)?.[1],
    }));

    for (const page of pages) {
      expect(page).toContain('<meta property="og:title"');
      expect(page).toContain('<meta property="og:description"');
      expect(page).toContain('<meta name="twitter:title"');
      expect(page).toContain('<meta name="twitter:description"');
      expect(page).toContain('type="application/ld+json"');
    }
    for (const key of ["title", "description", "canonical"] as const) {
      const entries = values.map((value) => value[key]);
      expect(entries.every(Boolean)).toBe(true);
      expect(new Set(entries).size).toBe(files.length);
    }
  });

  it("keeps Preview routes noindex and out of sitemap", async () => {
    const [home, decision, robots] = await Promise.all([
      readFile(join(previewOutput, "index.html"), "utf8"),
      readFile(join(previewOutput, "decision/writing-assistants.html"), "utf8"),
      readFile(join(previewOutput, "robots.txt"), "utf8"),
    ]);

    for (const page of [home, decision]) {
      expect(page).toContain('<meta name="robots" content="noindex, nofollow">');
      expect(page).not.toContain('rel="canonical"');
      expect(page).not.toContain('type="application/ld+json"');
    }
    expect(robots).toBe("User-agent: *\nDisallow: /\n");
    await expect(access(join(previewOutput, "sitemap-index.xml"))).rejects.toThrow();
  });
});
