import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import { matchingProhibitedAffiliateDisclosureClaims } from "./affiliate-disclosure-policy";

describe("Affiliate disclosure page", () => {
  let source: string;
  let pageSource: string;
  let navigationSource: string;
  let methodologySource: string;
  let offerPanelSource: string;
  let toolDetailSource: string;

  beforeAll(async () => {
    [source, pageSource, navigationSource, methodologySource, offerPanelSource, toolDetailSource] =
      await Promise.all([
        readFile(new URL("../src/content/pages/affiliate-disclosure.mdx", import.meta.url), "utf8"),
        readFile(new URL("../src/pages/affiliate-disclosure.astro", import.meta.url), "utf8"),
        readFile(new URL("../src/components/navigation.ts", import.meta.url), "utf8"),
        readFile(new URL("../src/content/pages/methodology.mdx", import.meta.url), "utf8"),
        readFile(new URL("../src/components/tool/OfferPanel.astro", import.meta.url), "utf8"),
        readFile(new URL("../src/components/tool/ToolDetail.astro", import.meta.url), "utf8"),
      ]);
  });

  it("publishes trusted MDX through the shared reading layout", () => {
    expect(source).toContain("status: published");
    expect(source).toMatch(/firstPublishedAt: ["']2026-07-17["']/);
    expect(pageSource).toContain('getEntry("pages", "affiliate-disclosure")');
    expect(pageSource).toContain("const { Content } = await render(page)");
    expect(pageSource).toContain("reading");
    expect(pageSource).toContain('<article class="trusted-content">');
    expect(pageSource.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(`${pageSource}\n${source}`).not.toContain("data-fixture");
    expect(`${pageSource}\n${source}`).not.toMatch(/placeholder|final content arrives later/i);
  });

  it("documents link separation, Offer qualification, compensation, and neutrality", () => {
    for (const text of [
      "Official Link",
      "Evidence Link",
      "Offer Link",
      "Verified deal",
      "Trackable affiliate offer",
      "research-only",
      "expired",
      "rejected",
      "may receive compensation",
      "sponsored",
      "Commercial neutrality",
    ]) {
      expect(source.toLowerCase()).toContain(text.toLowerCase());
    }

    expect(source).toMatch(/Official Link[\s\S]*neutral vendor destination/);
    expect(source).toMatch(/Offer Link[\s\S]*optional[\s\S]*Affiliate/i);
    expect(source).toMatch(/commercial data[\s\S]*cannot[\s\S]*(eligibility|order)/i);
    expect(source).toMatch(/no qualifying Offer[\s\S]*Official Link/i);
  });

  it("links disclosure consistently without coupling Official Link availability to an Offer", () => {
    expect(navigationSource).toContain('{ label: "Affiliate disclosure", href: "/affiliate-disclosure" }');
    expect(methodologySource).toContain("](/affiliate-disclosure)");
    expect(offerPanelSource).toContain('href="/affiliate-disclosure"');
    expect(offerPanelSource).toContain("StackBriefs may receive compensation");
    expect(toolDetailSource).toContain('data-link-type="official"');
    expect(toolDetailSource).toContain("{detail.offer && <OfferPanel offer={detail.offer} />}");
  });

  it("avoids commercial ranking or placement claims", () => {
    expect(matchingProhibitedAffiliateDisclosureClaims(source)).toEqual([]);

    for (const claim of [
      "Top tools",
      "The winner",
      "Ranking score: 92",
      "Featured placement",
      "The highest commission gets priority",
    ]) {
      expect(matchingProhibitedAffiliateDisclosureClaims(claim), claim).not.toEqual([]);
    }
  });
});
