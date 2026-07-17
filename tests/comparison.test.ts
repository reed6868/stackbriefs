import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import { projectComparison } from "../src/domain/comparison";
import { evaluateDecision } from "../src/domain/decision";
import type { DomainScenario, PublicationAssembly } from "../src/domain/model";
import { assemblePublication } from "../src/domain/publication";

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
    ...["charlie-compose", "delta-write", "echo-editor"].map((slug, index) => ({
      ...structuredClone(template),
      id: `candidate-${slug}`,
      toolId: `tool-${slug}`,
      tool: {
        ...structuredClone(template.tool),
        id: `tool-${slug}`,
        slug,
        name: `Writing Tool ${index + 3}`,
      },
    })),
  ];
  return expanded;
}

describe("Scenario comparison projection", () => {
  let writing: DomainScenario;
  let meetings: DomainScenario;

  beforeAll(async () => {
    const publication = assemblePublication(await loadGraph(), {
      target: "development",
      asOf: "2026-07-17",
    });
    writing = publishedScenario(publication, "writing-assistants");
    meetings = publishedScenario(publication, "meeting-assistants");
  });

  it("collapses below two Tools and preserves shortlist column order for two to four", () => {
    expect(projectComparison(writing, evaluateDecision(writing, []), ["alpha-writer"]))
      .toBeUndefined();

    const two = projectComparison(
      writing,
      evaluateDecision(writing, []),
      ["bravo-draft", "alpha-writer"],
    )!;
    expect(two.columns.map((column) => column.toolSlug)).toEqual([
      "bravo-draft",
      "alpha-writer",
    ]);

    const expanded = withFiveCandidates(writing);
    const four = projectComparison(expanded, evaluateDecision(expanded, []), [
      "alpha-writer",
      "bravo-draft",
      "charlie-compose",
      "delta-write",
    ])!;
    expect(four.columns).toHaveLength(4);
    expect(() => projectComparison(expanded, evaluateDecision(expanded, []), [
      "alpha-writer",
      "bravo-draft",
      "charlie-compose",
      "delta-write",
      "echo-editor",
    ])).toThrow(/at most 4 Tools/);
  });

  it("uses Scenario dimension order and retains value, evidence state, and relevant check date", () => {
    const projection = projectComparison(
      writing,
      evaluateDecision(writing, []),
      ["alpha-writer", "bravo-draft"],
    )!;

    expect(projection.rows.map((row) => row.dimensionId)).toEqual([
      "commercial-use",
      "export-formats",
      "collaboration-mode",
    ]);
    expect(projection.rows[1]!.cells[0]).toMatchObject({
      toolSlug: "alpha-writer",
      value: ["docx", "markdown"],
      evidenceState: "verified_fact",
      lastCheckedAt: "2026-07-16",
    });
    expect(JSON.stringify(projection)).not.toMatch(/winner|score|rank|affiliate|offer/i);
  });

  it("keeps no-longer-matching and unknown Tools explicit with every limitation", () => {
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
    const projection = projectComparison(
      uncertain,
      evaluation,
      ["alpha-writer", "bravo-draft"],
    )!;

    expect(projection.columns[0]).toMatchObject({
      toolSlug: "alpha-writer",
      eligibility: "unknown",
      eligibilityLabel: "Current eligibility has unknown evidence",
      limitation: "Fixture observations cover only the documented team plan.",
    });
    expect(projection.columns[1]).toMatchObject({
      toolSlug: "bravo-draft",
      eligibility: "match",
      limitation: "Fixture observations cover only the documented individual plan.",
    });
    expect(projection.rows[1]!.cells[0]).toMatchObject({
      value: undefined,
      evidenceState: "needs_recheck",
    });
  });

  it("never crosses Scenario boundaries and keeps heterogeneous rows isolated", () => {
    expect(() => projectComparison(
      writing,
      evaluateDecision(writing, []),
      ["alpha-writer", "delta-notes"],
    )).toThrow(/unknown Tool/);

    const meetingProjection = projectComparison(
      meetings,
      evaluateDecision(meetings, []),
      ["charlie-meet", "delta-notes"],
    )!;
    expect(meetingProjection.rows.map((row) => row.dimensionId)).toEqual([
      "retention-days",
      "consent-reminder",
      "hosting-region",
      "calendar-integrations",
    ]);
    expect(meetingProjection.rows.map((row) => row.dimensionId)).not.toContain("export-formats");
  });
});
