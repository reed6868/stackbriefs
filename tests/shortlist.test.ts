import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import { evaluateDecision } from "../src/domain/decision";
import type { DomainScenario, PublicationAssembly } from "../src/domain/model";
import { assemblePublication } from "../src/domain/publication";
import {
  SHORTLIST_LIMIT,
  addShortlistItem,
  projectShortlist,
  removeShortlistItem,
} from "../src/domain/shortlist";

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

function publishedScenario(assembly: PublicationAssembly, slug: string): DomainScenario {
  const outcome = assembly.scenarioOutcomes.find((candidate) => candidate.slug === slug);
  expect(outcome?.kind).toBe("published");
  return (outcome as Extract<typeof outcome, { kind: "published" }>).scenario;
}

function withFiveCandidates(scenario: DomainScenario) {
  const expanded = structuredClone(scenario);
  const template = expanded.candidates[0]!;
  expanded.candidates = [
    ...expanded.candidates,
    ...["charlie", "delta", "echo"].map((slug, index) => ({
      ...structuredClone(template),
      id: `candidate-${slug}`,
      toolId: `tool-${slug}`,
      tool: {
        ...structuredClone(template.tool),
        id: `tool-${slug}`,
        slug,
        name: `Tool ${index + 3}`,
      },
    })),
  ];
  return expanded;
}

describe("shortlist", () => {
  let writing: DomainScenario;

  beforeAll(async () => {
    writing = publishedScenario(
      assemblePublication(await loadGraph(), { target: "development", asOf: "2026-07-17" }),
      "writing-assistants",
    );
  });

  it("adds without mutation and treats a duplicate as an unchanged selection", () => {
    const current = ["alpha-writer"];
    const snapshot = [...current];

    expect(addShortlistItem(current, "bravo-draft")).toEqual({
      kind: "added",
      shortlist: ["alpha-writer", "bravo-draft"],
    });
    expect(addShortlistItem(current, "alpha-writer")).toEqual({
      kind: "unchanged",
      shortlist: ["alpha-writer"],
    });
    expect(current).toEqual(snapshot);
  });

  it("rejects a fifth item without inserting, replacing, or removing any Tool", () => {
    const current = ["alpha-writer", "bravo-draft", "charlie", "delta"];

    expect(SHORTLIST_LIMIT).toBe(4);
    expect(addShortlistItem(current, "echo")).toEqual({
      kind: "rejected",
      shortlist: current,
      reason: "Shortlist is full. Remove a Tool before adding another.",
    });
  });

  it("removes only the requested Tool and preserves the remaining order", () => {
    const current = ["alpha-writer", "bravo-draft", "charlie"];

    expect(removeShortlistItem(current, "bravo-draft")).toEqual([
      "alpha-writer",
      "charlie",
    ]);
    expect(removeShortlistItem(current, "missing")).toEqual(current);
  });

  it("projects hidden, single, compare-ready, and full states from normalized order", () => {
    const scenario = withFiveCandidates(writing);
    const evaluation = evaluateDecision(scenario, []);

    expect(projectShortlist(scenario, evaluation, [])).toMatchObject({
      items: [],
      countLabel: "0 tools shortlisted",
      canCompare: false,
      compareReason: "Choose at least two Tools to compare.",
      atLimit: false,
    });
    expect(projectShortlist(scenario, evaluation, ["alpha-writer"])).toMatchObject({
      countLabel: "1 tool shortlisted",
      canCompare: false,
      atLimit: false,
    });
    expect(projectShortlist(scenario, evaluation, ["bravo-draft", "alpha-writer"]).items
      .map((item) => item.toolSlug)).toEqual(["bravo-draft", "alpha-writer"]);
    expect(projectShortlist(scenario, evaluation, ["bravo-draft", "alpha-writer"])).toMatchObject({
      canCompare: true,
      compareReason: undefined,
      atLimit: false,
    });
    expect(projectShortlist(scenario, evaluation, [
      "alpha-writer",
      "bravo-draft",
      "charlie",
    ])).toMatchObject({
      countLabel: "3 tools shortlisted",
      canCompare: true,
      atLimit: false,
    });
    expect(projectShortlist(scenario, evaluation, [
      "alpha-writer",
      "bravo-draft",
      "charlie",
      "delta",
    ])).toMatchObject({
      countLabel: "4 tools shortlisted",
      canCompare: true,
      atLimit: true,
      limitReason: "Shortlist is full. Remove a Tool before adding another.",
    });
  });

  it("retains shortlisted Tools and marks changing eligibility without reordering", () => {
    const evaluation = evaluateDecision(writing, [{
      dimensionId: "export-formats",
      mode: "required",
      value: "pdf",
    }]);
    const projection = projectShortlist(writing, evaluation, ["alpha-writer", "bravo-draft"]);

    expect(projection.items).toEqual([
      expect.objectContaining({
        toolSlug: "alpha-writer",
        eligibility: "no_match",
        eligibilityLabel: "No longer matches required conditions",
      }),
      expect.objectContaining({
        toolSlug: "bravo-draft",
        eligibility: "match",
        eligibilityLabel: "Matches current filters",
      }),
    ]);
  });

  it("keeps unknown eligibility distinct from a known mismatch", () => {
    const uncertain = structuredClone(writing);
    const alpha = uncertain.candidates.find((candidate) => candidate.tool.slug === "alpha-writer")!;
    const exportClaim = alpha.claims.find((claim) => claim.dimensionId === "export-formats")!;
    exportClaim.evidence = {
      ...exportClaim.evidence,
      state: "needs_recheck",
      value: undefined,
    };
    const evaluation = evaluateDecision(uncertain, [{
      dimensionId: "export-formats",
      mode: "required",
      value: "pdf",
    }]);

    expect(projectShortlist(uncertain, evaluation, ["alpha-writer"]).items[0]).toMatchObject({
      eligibility: "unknown",
      eligibilityLabel: "Current eligibility has unknown evidence",
    });
  });
});
