import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import { matchingProhibitedMethodologyClaims } from "./methodology-policy";

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

  it("avoids unsupported ranking and evidence-strength claims", () => {
    expect(matchingProhibitedMethodologyClaims(source)).toEqual([]);

    for (const claim of [
      "Top tools for writers",
      "The best choice for small teams",
      "Score: 92",
      "95% confidence",
      "The source majority determines the result",
      "The source count decides the result",
    ]) {
      expect(matchingProhibitedMethodologyClaims(claim), claim).not.toEqual([]);
    }
  });
});
