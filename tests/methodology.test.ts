import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

describe("Methodology page", () => {
  let source: string;
  let pageSource: string;

  beforeAll(async () => {
    source = await readFile(new URL("../src/content/pages/methodology.mdx", import.meta.url), "utf8");
    pageSource = await readFile(new URL("../src/pages/methodology.astro", import.meta.url), "utf8");
  });

  it("publishes trusted MDX through the shared reading layout", () => {
    expect(source).toContain("status: published");
    expect(source).toMatch(/firstPublishedAt: ["']2026-07-17["']/);
    expect(pageSource).toContain('getEntry("pages", "methodology")');
    expect(pageSource).toContain("const { Content } = await render(page)");
    expect(pageSource).toContain("reading");
    expect(pageSource).toContain('<article class="trusted-content">');
    expect(pageSource.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(`${pageSource}\n${source}`).not.toContain("data-fixture");
    expect(`${pageSource}\n${source}`).not.toMatch(/placeholder|final content arrives later/i);
  });

  it("documents the implemented decision and evidence contract", () => {
    for (const text of [
      "Required conditions",
      "Optional preferences",
      "Unknown evidence",
      "Zero results",
      "Evidence authority",
      "Freshness windows",
      "Conflicting evidence",
      "Hands-on status",
      "Corrections",
      "Commercial neutrality",
    ]) {
      expect(source).toContain(text);
    }
    for (const state of [
      "Verified fact",
      "Editorial assessment",
      "Not verified",
      "Needs recheck",
      "Not applicable",
      "Conflicting",
    ]) {
      expect(source).toContain(state);
    }
    expect(source).toMatch(/7 days[\s\S]*30 days[\s\S]*90 days/);
    expect(source).toContain("tested");
    expect(source).toContain("partially tested");
    expect(source).toContain("not tested");
    expect(source).toContain("unavailable");
  });

  it("provides accessible navigation, reference structure, and related paths", () => {
    expect(source).toContain('<nav aria-label="On this page"');
    expect(source).toMatch(/href="#how-matching-works"/);
    expect(source).toContain("## How matching works");
    expect(source).toContain('role="region"');
    expect(source).toContain('aria-label="Evidence state reference"');
    expect(source).toMatch(/<th[^>]+scope="col"/);
    expect(source).toContain("](/decision/writing-assistants)");
    expect(source).toContain("](/affiliate-disclosure)");
  });

  it("avoids unsupported ranking and evidence-strength claims", () => {
    expect(source).not.toMatch(/\bwinner\b|\bbest tool\b|\btop-ranked\b|ranking score/i);
    expect(source).not.toMatch(/confidence (score|percentage|rating)/i);
    expect(source).not.toMatch(/majority (vote|wins|decides)/i);
  });
});
