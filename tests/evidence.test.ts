import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import {
  resolveContentEvidence,
  toGatingClaimReadiness,
} from "../src/domain/content-evidence";
import {
  downgradeEvidenceForBrowser,
  resolveEvidence,
  type EvidenceClaim,
  type EvidenceObservation,
} from "../src/domain/evidence";

async function loadGraph() {
  const root = new URL("../src/content/", import.meta.url);
  return {
    scenarios: JSON.parse(await readFile(new URL("scenarios/index.json", root), "utf8")),
    tools: JSON.parse(await readFile(new URL("tools/index.json", root), "utf8")),
    candidates: JSON.parse(await readFile(new URL("candidates/index.json", root), "utf8")),
    sources: JSON.parse(await readFile(new URL("sources/index.json", root), "utf8")),
    offers: JSON.parse(await readFile(new URL("offers/index.json", root), "utf8")),
  } as ContentGraph;
}

const rightsClaim = {
  subjectType: "candidate",
  subjectId: "candidate-alpha",
  claimKey: "commercial-use",
  category: "rights",
  scope: { plan: "team", region: "global" },
} satisfies EvidenceClaim;

function observation(overrides: Partial<EvidenceObservation> = {}): EvidenceObservation {
  return {
    fixture: true,
    id: "source-default",
    subjectType: "candidate",
    subjectId: "candidate-alpha",
    claimKey: "commercial-use",
    sourceType: "official_legal",
    sourceUrl: "https://evidence.example/source-default",
    assertion: "value",
    observedValue: true,
    scope: { plan: "team", region: "global" },
    lastCheckedAt: "2026-07-10",
    ...overrides,
  } as EvidenceObservation;
}

describe("evidence resolution", () => {
  it("uses agreeing evidence at the highest current qualifying authority", () => {
    const observations = [
      observation({ id: "legal", sourceType: "official_legal", observedValue: true }),
      observation({ id: "docs", sourceType: "official_documentation", observedValue: true }),
      observation({ id: "help", sourceType: "direct_help_page", observedValue: false }),
      observation({ id: "review", sourceType: "independent_review", observedValue: false }),
    ];
    const result = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations,
    });

    expect(result).toMatchObject({
      state: "verified_fact",
      value: true,
      authority: "primary",
      sourceIds: ["docs", "legal"],
      freshnessWindowDays: 90,
    });
    expect(resolveEvidence({ claim: rightsClaim, asOf: "2026-07-17", observations: [...observations].reverse() })).toEqual(
      result,
    );
  });

  it("lets direct product evidence qualify only when no relevant primary authority is current", () => {
    const result = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({ id: "irrelevant-pricing", sourceType: "official_pricing", observedValue: false }),
        observation({ id: "direct-terms", sourceType: "direct_product_page", observedValue: true }),
      ],
    });

    expect(result).toMatchObject({
      state: "verified_fact",
      value: true,
      authority: "direct",
      sourceIds: ["direct-terms"],
    });
  });

  it("preserves equal-authority conflict despite majority, source count, or recency", () => {
    const result = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({ id: "legal-new", observedValue: true, lastCheckedAt: "2026-07-17" }),
        observation({ id: "legal-old", observedValue: true, lastCheckedAt: "2026-06-01" }),
        observation({
          id: "docs-conflict",
          sourceType: "official_documentation",
          observedValue: false,
          lastCheckedAt: "2026-07-16",
        }),
      ],
    });

    expect(result.state).toBe("conflicting");
    expect(result.sourceIds).toEqual(["docs-conflict", "legal-new", "legal-old"]);
    expect(result.value).toBeUndefined();
  });

  it("treats wrong-scope evidence as neither proof nor disproof", () => {
    const result = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({ id: "wrong-plan", observedValue: false, scope: { plan: "individual", region: "global" } }),
        observation({ id: "missing-region", observedValue: true, scope: { plan: "team" } }),
      ],
    });

    expect(result).toMatchObject({ state: "not_verified", sourceIds: [] });
  });

  it("keeps weak-source agreement not verified unless an editor authors an explicit assessment", () => {
    const weakResult = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({ id: "review", sourceType: "independent_review", observedValue: true }),
        observation({ id: "community", sourceType: "community_report", observedValue: true }),
      ],
    });

    expect(weakResult).toMatchObject({ state: "not_verified", sourceIds: [] });
    expect(toGatingClaimReadiness("candidate-alpha", "commercial-use", weakResult)).toMatchObject({
      state: "missing",
    });

    const editorialResult = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({
          id: "editorial-assessment",
          sourceType: "stackbriefs_editorial",
          assertion: "editorial_assessment",
          observedValue: true,
        }),
      ],
    });
    expect(editorialResult).toMatchObject({
      state: "editorial_assessment",
      value: true,
      authority: "editorial",
    });
    expect(toGatingClaimReadiness("candidate-alpha", "commercial-use", editorialResult)).toMatchObject({
      state: "missing",
    });
  });

  it.each([
    { category: "deal" as const, checked: "2026-07-01", current: "2026-07-08", stale: "2026-07-09", days: 7 },
    { category: "price" as const, checked: "2026-07-01", current: "2026-07-31", stale: "2026-08-01", days: 30 },
    { category: "capability" as const, checked: "2026-04-01", current: "2026-06-30", stale: "2026-07-01", days: 90 },
  ])("applies the $days-day freshness window to $category claims", ({ category, checked, current, stale, days }) => {
    const claim = { ...rightsClaim, category };
    const sourceType = category === "deal" || category === "price" ? "official_pricing" : "official_documentation";
    const observations = [observation({ sourceType, lastCheckedAt: checked })];

    expect(resolveEvidence({ claim, observations, asOf: current })).toMatchObject({
      state: "verified_fact",
      freshnessWindowDays: days,
    });
    expect(resolveEvidence({ claim, observations, asOf: stale })).toMatchObject({
      state: "needs_recheck",
      freshnessWindowDays: days,
    });
  });

  it("resolves Offer-targeted deal evidence without admitting Offer fields into decision claims", () => {
    const claim = {
      subjectType: "offer",
      subjectId: "offer-alpha",
      claimKey: "status",
      category: "deal",
      scope: { region: "global" },
    } satisfies EvidenceClaim;
    const observations = [
      observation({
        id: "offer-status",
        subjectType: "offer",
        subjectId: "offer-alpha",
        claimKey: "status",
        sourceType: "official_pricing",
        observedValue: "verified_deal",
        scope: { region: "global" },
        lastCheckedAt: "2026-07-10",
      }),
    ];

    expect(resolveEvidence({ claim, observations, asOf: "2026-07-17" })).toMatchObject({
      state: "verified_fact",
      value: "verified_deal",
      freshnessWindowDays: 7,
    });
    expect(resolveEvidence({ claim, observations, asOf: "2026-07-18" }).state).toBe("needs_recheck");
  });

  it("resolves a current explicit qualifying non-applicability assertion", () => {
    const result = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({
          id: "legal-not-applicable",
          assertion: "not_applicable",
          observedValue: undefined,
        }),
      ],
    });

    expect(result).toMatchObject({
      state: "not_applicable",
      authority: "primary",
      sourceIds: ["legal-not-applicable"],
    });
    expect(toGatingClaimReadiness("candidate-alpha", "commercial-use", result)).toMatchObject({ state: "current" });
  });

  it("does not let effective dates extend freshness or preserve expired evidence", () => {
    const result = resolveEvidence({
      claim: rightsClaim,
      asOf: "2026-07-17",
      observations: [
        observation({
          id: "expired-terms",
          lastCheckedAt: "2026-07-16",
          effectiveTo: "2026-07-15",
        }),
      ],
    });

    expect(result.state).toBe("needs_recheck");
  });

  it("keeps browser expiry at parity with build resolution and permits downgrades only", () => {
    const claim = { ...rightsClaim, category: "deal" as const };
    const observations = [
      observation({ sourceType: "official_pricing", lastCheckedAt: "2026-07-01" }),
    ];
    const deployed = resolveEvidence({ claim, observations, asOf: "2026-07-08" });

    expect(deployed.state).toBe("verified_fact");
    expect(downgradeEvidenceForBrowser(deployed, "2026-07-08").state).toBe("verified_fact");
    expect(downgradeEvidenceForBrowser(deployed, "2026-07-09").state).toBe("needs_recheck");
    expect(resolveEvidence({ claim, observations, asOf: "2026-07-09" }).state).toBe("needs_recheck");

    const staleDeployment = resolveEvidence({ claim, observations, asOf: "2026-07-09" });
    expect(downgradeEvidenceForBrowser(staleDeployment, "2026-07-01").state).toBe("needs_recheck");
  });

  it("treats enum-set values as canonical sets rather than source ordering", () => {
    const claim = {
      ...rightsClaim,
      claimKey: "export-formats",
      category: "export" as const,
    };
    const result = resolveEvidence({
      claim,
      asOf: "2026-07-17",
      observations: [
        observation({
          id: "docs-a",
          claimKey: "export-formats",
          sourceType: "official_documentation",
          observedValue: ["docx", "markdown"],
        }),
        observation({
          id: "docs-b",
          claimKey: "export-formats",
          sourceType: "official_documentation",
          observedValue: ["markdown", "docx"],
        }),
      ],
    });

    expect(result).toMatchObject({ state: "verified_fact", value: ["docx", "markdown"] });
  });

  it("resolves authoritative claim bindings into deterministic publication gating inputs", async () => {
    const result = resolveContentEvidence(await loadGraph(), "2026-07-17");

    expect(result.claims).toHaveLength(14);
    expect(result.gatingClaims).toHaveLength(14);
    expect(result.gatingClaims.every((claim) => claim.state === "current")).toBe(true);
    expect(
      result.claims.find(
        (claim) => claim.candidateId === "candidate-writing-alpha" && claim.dimensionId === "commercial-use",
      ),
    ).toMatchObject({
      claim: {
        category: "rights",
        scope: { plan: "team", region: "global" },
      },
      resolution: { state: "verified_fact", value: true },
    });
  });

  it("keeps Offer mutations and Offer-targeted observations outside claim resolution", async () => {
    const graph = await loadGraph();
    const claim = {
      subjectType: "candidate",
      subjectId: "candidate-writing-alpha",
      claimKey: "commercial-use",
      category: "rights",
      scope: { plan: "team", region: "global" },
    } satisfies EvidenceClaim;
    const before = resolveEvidence({ claim, observations: graph.sources, asOf: "2026-07-17" });

    graph.offers[0]!.affiliateUrl = "https://commercial.example/highest-commission";
    graph.offers[0]!.terms = "Commission-only mutation";
    const after = resolveEvidence({ claim, observations: graph.sources, asOf: "2026-07-17" });

    expect(after).toEqual(before);
  });
});
