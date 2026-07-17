import { readFile } from "node:fs/promises";

import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import ToolDetail from "../src/components/tool/ToolDetail.astro";
import { assemblePublication } from "../src/domain/publication";
import { projectToolDetail, type ToolDetailProjection } from "../src/domain/tool-detail";
import type { EvidenceState } from "../src/domain/evidence-types";

async function readCollection<Name extends keyof ContentGraph>(name: Name): Promise<ContentGraph[Name]> {
  return JSON.parse(await readFile(new URL(`../src/content/${name}/index.json`, import.meta.url), "utf8"));
}

async function loadGraph(): Promise<ContentGraph> {
  return {
    scenarios: await readCollection("scenarios"),
    tools: await readCollection("tools"),
    candidates: await readCollection("candidates"),
    sources: await readCollection("sources"),
    offers: await readCollection("offers"),
  };
}

describe("Tool detail rendering", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let alpha: ToolDetailProjection;

  beforeAll(async () => {
    container = await AstroContainer.create();
    const publication = assemblePublication(await loadGraph(), {
      target: "development",
      asOf: "2026-07-17",
    });
    alpha = projectToolDetail(publication, "alpha-writer")!;
  });

  async function render(detail: ToolDetailProjection) {
    return container.renderToString(ToolDetail, { props: { detail } });
  }

  it("renders useful direct-entry identity and every Scenario-specific context field", async () => {
    const html = await render(alpha);

    expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(html).toContain("Alpha Writer");
    expect(html).toContain(alpha.tool.summary);
    expect(html).toContain('href="https://alpha.example/"');
    expect(html).toContain("Official Link");
    expect(html).toContain("Writing assistants for small teams");
    expect(html).toContain("Fixture observations cover only the documented team plan.");
    expect(html).toContain("Partially tested");
    expect(html).toContain("Confirm current commercial-use terms for the evaluated plan.");
    expect(html).toContain('data-tool-scenario-breadcrumb hidden');
    expect(html).toContain('data-tool-return hidden');
    expect(html).not.toMatch(/winner|best|score|rank/i);
    expect(html).not.toContain("Claim evidence");
  });

  it("uses a fixed-size readable fallback when no Logo is supplied", async () => {
    const html = await render(alpha);

    expect(html).toContain('data-tool-logo-fallback');
    expect(html).toContain("AW");
    expect(html).not.toContain('data-tool-logo-image');
  });

  it("renders a Logo and keeps the same fallback available for broken assets", async () => {
    const withLogo: ToolDetailProjection = {
      ...alpha,
      tool: {
        ...alpha.tool,
        logo: { src: "/fixtures/alpha-logo.svg", alt: "Alpha Writer logo" },
      },
    };
    const html = await render(withLogo);

    expect(html).toContain('data-tool-logo-image');
    expect(html).toContain('src="/fixtures/alpha-logo.svg"');
    expect(html).toContain('width="72"');
    expect(html).toContain('height="72"');
    expect(html).toContain('data-tool-logo-fallback hidden');
  });

  it("renders multiple Scenario contexts as separate conclusions", async () => {
    const detail: ToolDetailProjection = {
      ...alpha,
      contexts: [
        {
          ...alpha.contexts[0]!,
          scenarioId: "scenario-meeting-assistants",
          scenarioSlug: "meeting-assistants",
          scenarioTitle: "AI meeting assistants for client calls",
          limitation: "Meeting-specific limitation.",
        },
        alpha.contexts[0]!,
      ],
    };
    const html = await render(detail);

    expect(html.match(/data-tool-context=/g)).toHaveLength(2);
    expect(html).toContain("AI meeting assistants for client calls");
    expect(html).toContain("Meeting-specific limitation.");
    expect(html).toContain("Writing assistants for small teams");
    expect(html).toContain("Fixture observations cover only the documented team plan.");
  });

  it("does not truncate long Scenario limitations or checklist content", async () => {
    const longText = "Long context ".repeat(80).trim();
    const detail: ToolDetailProjection = {
      ...alpha,
      contexts: [{
        ...alpha.contexts[0]!,
        limitation: longText,
        verificationChecklist: [longText],
      }],
    };
    const html = await render(detail);

    expect(html).toContain(longText);
    expect(html.match(new RegExp(longText, "g"))).toHaveLength(2);
  });

  it.each([
    ["verified_fact", "Verified fact", true],
    ["editorial_assessment", "Editorial assessment", false],
    ["not_verified", "Not verified", false],
    ["needs_recheck", "Needs recheck", false],
    ["not_applicable", "Not applicable", false],
    ["conflicting", "Conflicting", false],
  ] as const)("renders %s Claims without overstating verification", async (state, label, verified) => {
    const detail = structuredClone(alpha);
    detail.contexts[0]!.claims = detail.contexts[0]!.claims.map((claim) => ({
      ...claim,
      evidence: {
        ...claim.evidence,
        state: state as EvidenceState,
        value: verified || state === "editorial_assessment" ? claim.evidence.value : undefined,
      },
    }));
    const html = await render(detail);

    expect(html.match(new RegExp(label, "g"))).toHaveLength(3);
    if (!verified) expect(html).not.toContain("Verified fact");
    if (["not_verified", "needs_recheck", "conflicting"].includes(state)) {
      expect(html.match(/No current value/g)).toHaveLength(3);
    }
  });

  it("keeps Official, Evidence, and qualifying Affiliate Offer links structurally separate", async () => {
    const detail = structuredClone(alpha);
    detail.offer = {
      id: "offer-alpha",
      status: "verified_deal",
      statusLabel: "Verified deal",
      affiliateUrl: "https://offers.example/alpha",
      terms: "20% off the documented team plan.",
      region: "global",
      lastCheckedAt: "2026-07-16",
      validThrough: "2026-07-23",
      evidence: {
        state: "verified_fact",
        value: "verified_deal",
        authority: "primary",
        sourceIds: ["source-offer-alpha-status"],
        freshnessWindowDays: 7,
        resolvedAt: "2026-07-17",
        validThrough: "2026-07-23",
        explanation: "Current Offer status evidence",
      },
      sources: [{
        id: "source-offer-alpha-status",
        sourceType: "official_pricing",
        sourceUrl: "https://offers.example/alpha/status",
        lastCheckedAt: "2026-07-16",
        scope: { region: "global" },
      }],
    };
    const html = await render(detail);

    expect(html).toMatch(/data-link-type="official"[^>]*rel="noopener noreferrer"/);
    expect(html).toMatch(/data-link-type="evidence"[^>]*rel="noopener noreferrer"/);
    expect(html).toMatch(/data-link-type="offer"[^>]*rel="noopener sponsored"/);
    expect(html).toContain("Affiliate Offer");
    expect(html).toContain("Verified deal");
    expect(html).toContain("20% off the documented team plan.");
    expect(html).toContain("StackBriefs may receive compensation");
  });

  it("keeps the Official Link when no Offer qualifies and renders no commercial CTA language", async () => {
    const html = await render({ ...alpha, offer: undefined });

    expect(html).toContain("Official Link");
    expect(html).not.toMatch(/data-link-type="offer"[^>]+href=/);
    expect(html).not.toMatch(/Deal|Discount|20% off/);
  });
});
