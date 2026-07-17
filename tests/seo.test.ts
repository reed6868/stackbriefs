import { describe, expect, it } from "vitest";

import {
  buildStructuredData,
  canonicalUrl,
  renderRobotsTxt,
  serializeStructuredData,
} from "../src/domain/seo";

const site = new URL("https://stackbriefs.pages.dev");

describe("SEO projections", () => {
  it("canonicalizes query and fragment state to the slashless route", () => {
    expect(canonicalUrl(site, "/decision/writing-assistants?r=commercial-use:eq:true#comparison"))
      .toBe("https://stackbriefs.pages.dev/decision/writing-assistants");
    expect(canonicalUrl(site, "/methodology/")).toBe("https://stackbriefs.pages.dev/methodology");
    expect(canonicalUrl(site, "/")).toBe("https://stackbriefs.pages.dev/");
  });

  it("builds factual WebPage, breadcrumb, and Tool structured data without ranking claims", () => {
    const structuredData = buildStructuredData({
      title: "Alpha Writer | StackBriefs",
      description: "Published evidence and Scenario context for Alpha Writer.",
      canonicalUrl: "https://stackbriefs.pages.dev/tool/alpha-writer",
      site,
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Alpha Writer" },
      ],
      content: {
        kind: "software-application",
        name: "Alpha Writer",
        description: "A writing assistant evaluated in published Scenarios.",
        officialUrl: "https://alpha.example/",
      },
    });
    const serialized = JSON.stringify(structuredData);

    expect(structuredData["@graph"].map((node) => node["@type"])).toEqual([
      "WebPage",
      "BreadcrumbList",
      "SoftwareApplication",
    ]);
    expect(serialized).toContain('"sameAs":"https://alpha.example/"');
    expect(serialized).not.toMatch(/aggregateRating|review|offers|ranking|winner|best/i);
  });

  it("escapes executable JSON-LD boundaries", () => {
    const serialized = serializeStructuredData({
      "@context": "https://schema.org",
      name: "</ScRiPt><script>alert(1)</script><!--unsafe-->\u2028unsafe\u2029",
    });

    expect(serialized).not.toMatch(/<\/?script|<!--/i);
    expect(serialized).toContain("\\u003c/ScRiPt>");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });

  it("renders production and preview robots policies", () => {
    expect(renderRobotsTxt(true, site)).toBe([
      "User-agent: *",
      "Allow: /",
      "Sitemap: https://stackbriefs.pages.dev/sitemap-index.xml",
      "",
    ].join("\n"));
    expect(renderRobotsTxt(false, site)).toBe("User-agent: *\nDisallow: /\n");
  });
});
