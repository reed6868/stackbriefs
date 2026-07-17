import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { ContentGraph, OfferContent } from "../src/content/schema";
import { projectComparison } from "../src/domain/comparison";
import { evaluateDecision } from "../src/domain/decision";
import { assemblePublication } from "../src/domain/publication";
import {
  downgradeToolDetailForBrowser,
  projectToolDetail,
} from "../src/domain/tool-detail";

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

async function graphWithOffer(
  status: OfferContent["status"],
  options: {
    sourceCheckedAt?: string;
    offerCheckedAt?: string;
    evidenceClaim?: "status" | "terms";
    sourceRegion?: string;
  } = {},
) {
  const graph = await loadGraph();
  const evidenceClaim = options.evidenceClaim ?? "status";
  const terms = "20% off the documented team plan for the first billing period.";
  graph.offers[0] = {
    ...graph.offers[0]!,
    status,
    lastCheckedAt: options.offerCheckedAt ?? "2026-07-16",
    evidenceIds: ["source-offer-alpha-status"],
    terms,
    region: "global",
  };
  graph.sources.push({
    fixture: true,
    id: "source-offer-alpha-status",
    subjectType: "offer",
    subjectId: graph.offers[0]!.id,
    claimKey: evidenceClaim,
    sourceType: "official_pricing",
    sourceUrl: "https://offers.example/alpha/status",
    assertion: "value",
    observedValue: evidenceClaim === "status" ? status : terms,
    scope: { region: options.sourceRegion ?? "global" },
    lastCheckedAt: options.sourceCheckedAt ?? "2026-07-16",
  });
  return graph;
}

function publication(graph: ContentGraph) {
  return assemblePublication(graph, { target: "development", asOf: "2026-07-17" });
}

describe("Tool evidence and Offer projection", () => {
  it("retains ordered Claim state, scope, selected sources, and dates", async () => {
    const detail = projectToolDetail(publication(await loadGraph()), "alpha-writer")!;

    expect(detail.contexts[0]!.claims.map((claim) => claim.dimensionId)).toEqual([
      "commercial-use",
      "export-formats",
      "collaboration-mode",
    ]);
    expect(detail.contexts[0]!.claims[1]).toMatchObject({
      label: "Export formats",
      scope: { plan: "team", platform: "web" },
      evidence: {
        state: "verified_fact",
        value: ["docx", "markdown"],
      },
      lastCheckedAt: "2026-07-16",
      sources: [{
        sourceType: "official_documentation",
        sourceUrl: "https://alpha.example/docs/export",
        lastCheckedAt: "2026-07-16",
      }],
    });
  });

  it.each(["verified_deal", "trackable_offer"] as const)(
    "renders only current qualifying %s records as an Affiliate Offer",
    async (status) => {
      const detail = projectToolDetail(publication(await graphWithOffer(status)), "alpha-writer")!;

      expect(detail.offer).toMatchObject({
        status,
        affiliateUrl: "https://offers.example/alpha",
        terms: expect.stringContaining("20% off"),
        region: "global",
        lastCheckedAt: "2026-07-16",
        evidence: { state: "verified_fact", value: status },
      });
    },
  );

  it.each(["research_only", "expired", "rejected"] as const)(
    "keeps %s records outside the public Offer projection",
    async (status) => {
      const graph = await loadGraph();
      graph.offers[0] = { ...graph.offers[0]!, status, evidenceIds: [] };

      expect(projectToolDetail(publication(graph), "alpha-writer")!.offer).toBeUndefined();
    },
  );

  it("rejects missing, invalid, stale, and status-unverified Offers", async () => {
    const missing = await loadGraph();
    missing.offers = [];
    expect(projectToolDetail(publication(missing), "alpha-writer")!.offer).toBeUndefined();

    const invalid = await graphWithOffer("verified_deal");
    invalid.offers[0]!.toolId = "tool-missing";
    expect(projectToolDetail(publication(invalid), "alpha-writer")!.offer).toBeUndefined();

    expect(projectToolDetail(publication(await graphWithOffer("verified_deal", {
      sourceCheckedAt: "2026-07-09",
    })), "alpha-writer")!.offer).toBeUndefined();
    expect(projectToolDetail(publication(await graphWithOffer("verified_deal", {
      offerCheckedAt: "2026-07-09",
    })), "alpha-writer")!.offer).toBeUndefined();
    expect(projectToolDetail(publication(await graphWithOffer("verified_deal", {
      offerCheckedAt: "2026-07-18",
    })), "alpha-writer")!.offer).toBeUndefined();
    expect(projectToolDetail(publication(await graphWithOffer("verified_deal", {
      sourceRegion: "us",
    })), "alpha-writer")!.offer).toBeUndefined();
    expect(projectToolDetail(publication(await graphWithOffer("verified_deal", {
      evidenceClaim: "terms",
    })), "alpha-writer")!.offer).toBeUndefined();
  });

  it("downgrades deployed Claims and removes an expired Offer in the browser", async () => {
    const detail = projectToolDetail(
      publication(await graphWithOffer("verified_deal")),
      "alpha-writer",
    )!;
    const downgraded = downgradeToolDetailForBrowser(detail, "2030-01-01");

    expect(downgraded.offer).toBeUndefined();
    expect(downgraded.contexts[0]!.claims).toHaveLength(3);
    expect(downgraded.contexts[0]!.claims.every((claim) =>
      claim.evidence.state === "needs_recheck" && claim.evidence.value === undefined)).toBe(true);
  });

  it("keeps Decision and Comparison output invariant under Affiliate-only mutations", async () => {
    const baselineGraph = await loadGraph();
    const baseline = publication(baselineGraph);
    const baselineScenario = baseline.scenarioOutcomes.find((outcome) =>
      outcome.kind === "published" && outcome.slug === "writing-assistants");
    expect(baselineScenario?.kind).toBe("published");
    if (baselineScenario?.kind !== "published") return;
    const conditions = [{ dimensionId: "export-formats", mode: "required" as const, value: "pdf" }];
    const baselineDecision = evaluateDecision(baselineScenario.scenario, conditions);
    const baselineComparison = projectComparison(
        baselineScenario.scenario,
        baselineDecision,
        ["alpha-writer", "bravo-draft"],
      );
    const mutations = [
      (graph: ContentGraph) => { graph.offers = []; },
      (graph: ContentGraph) => {
        graph.offers[0]!.affiliateUrl = "https://commercial.example/highest-commission";
        graph.offers[0]!.terms = "Preferred paid placement";
        graph.offers[0]!.status = "rejected";
        graph.offers[0]!.region = "eu";
      },
    ];

    for (const mutate of mutations) {
      const mutatedGraph = structuredClone(baselineGraph);
      mutate(mutatedGraph);
      const mutated = publication(mutatedGraph);
      const mutatedScenario = mutated.scenarioOutcomes.find((outcome) =>
        outcome.kind === "published" && outcome.slug === "writing-assistants");
      expect(mutatedScenario?.kind).toBe("published");
      if (mutatedScenario?.kind !== "published") continue;
      const mutatedDecision = evaluateDecision(mutatedScenario.scenario, conditions);
      expect(mutatedDecision).toEqual(baselineDecision);
      expect(projectComparison(mutatedScenario.scenario, mutatedDecision, ["alpha-writer", "bravo-draft"]))
        .toEqual(baselineComparison);
    }
  });
});
