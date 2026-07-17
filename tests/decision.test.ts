import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import {
  evaluateDecision,
  type DecisionCondition,
} from "../src/domain/decision";
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

async function scenario(slug: string) {
  return publishedScenario(
    assemblePublication(await loadGraph(), { target: "development", asOf: "2026-07-17" }),
    slug,
  );
}

function condition(
  dimensionId: string,
  value: DecisionCondition["value"],
  mode: DecisionCondition["mode"] = "required",
): DecisionCondition {
  return { dimensionId, value, mode };
}

describe("decision evaluation", () => {
  it("evaluates boolean and enum equality with required AND semantics", async () => {
    const result = evaluateDecision(await scenario("writing-assistants"), [
      condition("commercial-use", true),
      condition("collaboration-mode", "shared-workspace"),
    ]);

    expect(result.matches.map((candidate) => candidate.candidateId)).toEqual(["candidate-writing-alpha"]);
    expect(result.exclusions).toMatchObject([
      {
        candidateId: "candidate-writing-bravo",
        state: "no_match",
        required: [
          { dimensionId: "commercial-use", state: "match" },
          { dimensionId: "collaboration-mode", state: "no_match" },
        ],
      },
    ]);
  });

  it("evaluates contains without treating a differently ordered set as different evidence", async () => {
    const result = evaluateDecision(await scenario("writing-assistants"), [
      condition("export-formats", "pdf"),
    ]);

    expect(result.matches.map((candidate) => candidate.candidateId)).toEqual(["candidate-writing-bravo"]);
    expect(result.exclusions.map((candidate) => candidate.candidateId)).toEqual(["candidate-writing-alpha"]);
  });

  it("evaluates lte, gte, and numeric eq operators", async () => {
    const meetings = await scenario("meeting-assistants");
    const lte = evaluateDecision(meetings, [condition("retention-days", 7)]);
    expect(lte.matches.map((candidate) => candidate.candidateId)).toEqual(["candidate-meetings-delta"]);

    const gteScenario = structuredClone(meetings);
    const gteDimension = gteScenario.dimensions.find((dimension) => dimension.id === "retention-days")!;
    if (gteDimension.valueType !== "number") throw new Error("expected numeric retention dimension");
    gteDimension.operator = "gte";
    const gte = evaluateDecision(gteScenario, [condition("retention-days", 30)]);
    expect(gte.matches.map((candidate) => candidate.candidateId)).toEqual(["candidate-meetings-charlie"]);

    const eqScenario = structuredClone(meetings);
    const eqDimension = eqScenario.dimensions.find((dimension) => dimension.id === "retention-days")!;
    if (eqDimension.valueType !== "number") throw new Error("expected numeric retention dimension");
    eqDimension.operator = "eq";
    const eq = evaluateDecision(eqScenario, [condition("retention-days", 30)]);
    expect(eq.matches.map((candidate) => candidate.candidateId)).toEqual(["candidate-meetings-charlie"]);
  });

  it("keeps unknown distinct from a known no-match and never inserts unknown candidates as matches", async () => {
    const meetings = structuredClone(await scenario("meeting-assistants"));
    const charlie = meetings.candidates.find((candidate) => candidate.id === "candidate-meetings-charlie")!;
    const consent = charlie.claims.find((claim) => claim.dimensionId === "consent-reminder")!;
    consent.evidence = {
      ...consent.evidence,
      state: "needs_recheck",
      value: undefined,
      explanation: "Consent evidence is stale",
    };

    const result = evaluateDecision(meetings, [condition("consent-reminder", true)]);

    expect(result.matches).toEqual([]);
    expect(result.exclusions.map((candidate) => ({ id: candidate.candidateId, state: candidate.state }))).toEqual([
      { id: "candidate-meetings-charlie", state: "unknown" },
      { id: "candidate-meetings-delta", state: "no_match" },
    ]);
  });

  it("treats explicit non-applicability as a known no-match", async () => {
    const writing = structuredClone(await scenario("writing-assistants"));
    const alpha = writing.candidates.find((candidate) => candidate.id === "candidate-writing-alpha")!;
    const commercialUse = alpha.claims.find((claim) => claim.dimensionId === "commercial-use")!;
    commercialUse.evidence = {
      ...commercialUse.evidence,
      state: "not_applicable",
      value: undefined,
      explanation: "Commercial use does not apply",
    };

    const result = evaluateDecision(writing, [condition("commercial-use", true)]);
    expect(result.exclusions).toMatchObject([
      {
        candidateId: "candidate-writing-alpha",
        state: "no_match",
        required: [{ evidenceState: "not_applicable", state: "no_match" }],
      },
    ]);
  });

  it("keeps optional preferences explanatory without changing membership, order, or alternatives", async () => {
    const writing = await scenario("writing-assistants");
    const baseline = evaluateDecision(writing, [condition("commercial-use", true)]);
    const preferredShared = evaluateDecision(writing, [
      condition("commercial-use", true),
      condition("collaboration-mode", "shared-workspace", "optional"),
    ]);
    const preferredIndividual = evaluateDecision(writing, [
      condition("commercial-use", true),
      condition("collaboration-mode", "individual-only", "optional"),
    ]);
    const summarize = (result: ReturnType<typeof evaluateDecision>) => ({
      matches: result.matches.map((candidate) => candidate.candidateId),
      exclusions: result.exclusions.map((candidate) => candidate.candidateId),
      alternatives: result.relaxations,
    });

    expect(summarize(preferredShared)).toEqual(summarize(baseline));
    expect(summarize(preferredIndividual)).toEqual(summarize(baseline));
    expect(preferredShared.matches[0]?.optional).toMatchObject([
      { dimensionId: "collaboration-mode", state: "match" },
    ]);
    expect(preferredShared.matches[1]?.optional).toMatchObject([
      { dimensionId: "collaboration-mode", state: "no_match" },
    ]);
  });

  it("sorts by normalized Tool name, then slug, independently of file order", async () => {
    const writing = structuredClone(await scenario("writing-assistants"));
    const alpha = writing.candidates.find((candidate) => candidate.id === "candidate-writing-alpha")!;
    const bravo = writing.candidates.find((candidate) => candidate.id === "candidate-writing-bravo")!;
    alpha.tool.name = "Zulu";
    alpha.tool.slug = "zulu";
    bravo.tool.name = "  álpha  ";
    bravo.tool.slug = "alpha";
    writing.candidates = [...writing.candidates].reverse();

    expect(evaluateDecision(writing, []).matches.map((candidate) => candidate.candidateId)).toEqual([
      "candidate-writing-bravo",
      "candidate-writing-alpha",
    ]);

    alpha.tool.name = "Éclair";
    alpha.tool.slug = "eclair-z";
    bravo.tool.name = "eclair";
    bravo.tool.slug = "eclair-a";
    expect(evaluateDecision(writing, []).matches.map((candidate) => candidate.candidateId)).toEqual([
      "candidate-writing-bravo",
      "candidate-writing-alpha",
    ]);
  });

  it("orders condition explanations by Scenario dimension order and limitation last", async () => {
    const writing = await scenario("writing-assistants");
    const result = evaluateDecision(writing, [
      condition("collaboration-mode", "shared-workspace", "optional"),
      condition("commercial-use", true),
      condition("export-formats", "docx"),
    ]);

    expect(result.matches[0]?.explanations.map((explanation) =>
      explanation.kind === "condition" ? explanation.dimensionId : explanation.kind)).toEqual([
      "commercial-use",
      "export-formats",
      "collaboration-mode",
      "limitation",
    ]);
    expect(result).toEqual(evaluateDecision(writing, [
      condition("commercial-use", true),
      condition("export-formats", "docx"),
      condition("collaboration-mode", "shared-workspace", "optional"),
    ]));
  });

  it("derives explicit one-condition relaxation options without changing the applied state", async () => {
    const conditions = [
      condition("export-formats", "pdf"),
      condition("collaboration-mode", "shared-workspace"),
    ];
    const result = evaluateDecision(await scenario("writing-assistants"), conditions);

    expect(result.matches).toEqual([]);
    expect(result.relaxations).toEqual([
      {
        dimensionId: "export-formats",
        label: "Export formats",
        currentValue: "pdf",
        candidateIds: ["candidate-writing-alpha"],
      },
      {
        dimensionId: "collaboration-mode",
        label: "Collaboration mode",
        currentValue: "shared-workspace",
        candidateIds: ["candidate-writing-bravo"],
      },
    ]);
    expect(conditions).toEqual([
      condition("export-formats", "pdf"),
      condition("collaboration-mode", "shared-workspace"),
    ]);

    const withOptional = evaluateDecision(await scenario("writing-assistants"), [
      ...conditions,
      condition("commercial-use", false, "optional"),
    ]);
    expect(withOptional.relaxations).toEqual(result.relaxations);
  });

  it("rejects non-normalized conditions instead of silently weakening them", async () => {
    const writing = await scenario("writing-assistants");

    expect(() => evaluateDecision(writing, [condition("missing-dimension", true)])).toThrow(/unknown Dimension/);
    expect(() =>
      evaluateDecision(writing, [condition("commercial-use", true), condition("commercial-use", false)]),
    ).toThrow(/one active condition per Dimension/);
    expect(() => evaluateDecision(writing, [condition("export-formats", "txt")])).toThrow(/invalid value/);
    expect(() =>
      evaluateDecision(writing, [
        { dimensionId: "commercial-use", value: true, mode: "invalid" } as unknown as DecisionCondition,
      ]),
    ).toThrow(/invalid mode/);
  });

  it("keeps heterogeneous Scenario dimensions isolated", async () => {
    const writing = await scenario("writing-assistants");
    const meetings = await scenario("meeting-assistants");

    expect(() => evaluateDecision(writing, [condition("hosting-region", "eu")])).toThrow(/unknown Dimension/);
    expect(() => evaluateDecision(meetings, [condition("export-formats", "pdf")])).toThrow(/unknown Dimension/);
  });

  it("is invariant to Affiliate-only mutations and exposes no score, rank, or winner", async () => {
    const graph = await loadGraph();
    const baselineScenario = publishedScenario(
      assemblePublication(graph, { target: "development", asOf: "2026-07-17" }),
      "writing-assistants",
    );
    const baseline = evaluateDecision(baselineScenario, [condition("export-formats", "pdf")]);

    graph.offers[0]!.affiliateUrl = "https://commercial.example/highest-commission";
    graph.offers[0]!.terms = "Preferred commercial placement";
    const mutatedScenario = publishedScenario(
      assemblePublication(graph, { target: "development", asOf: "2026-07-17" }),
      "writing-assistants",
    );
    const mutated = evaluateDecision(mutatedScenario, [condition("export-formats", "pdf")]);

    expect(mutated).toEqual(baseline);
    expect(JSON.stringify(mutated)).not.toMatch(/winner|score|rank/i);
  });
});
