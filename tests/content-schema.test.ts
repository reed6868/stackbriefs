import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  candidateSchema,
  offerSchema,
  parseContentGraph,
  publicationHistorySchema,
  scenarioSchema,
  sourceSchema,
  toolSchema,
  type ContentGraphInput,
  validatePublicationHistoryEvolution,
} from "../src/content/schema";

const execFileAsync = promisify(execFile);

const baseGraph: ContentGraphInput = {
  scenarios: [
    {
      fixture: true,
      id: "scenario-writing",
      slug: "writing-workflows",
      status: "published",
      lastReviewedAt: "2026-07-16",
      title: "Writing workflows",
      goal: "Choose a writing assistant for a small editorial team.",
      prerequisites: ["A human reviews every draft before publication."],
      suitableFor: "Small teams with an editorial review step.",
      notSuitableFor: "Autonomous regulated publishing.",
      dimensions: [
        {
          id: "commercial-use",
          label: "Commercial use",
          valueType: "boolean",
          operator: "eq",
          order: 1,
        },
        {
          id: "export-formats",
          label: "Export formats",
          valueType: "enum-set",
          operator: "contains",
          order: 2,
          allowedValues: [
            { value: "docx", label: "DOCX" },
            { value: "markdown", label: "Markdown" },
          ],
        },
      ],
      candidateIds: ["candidate-writing-alpha"],
      verificationChecklist: ["Confirm current commercial-use terms."],
    },
    {
      fixture: true,
      id: "scenario-meetings",
      slug: "meeting-workflows",
      status: "published",
      lastReviewedAt: "2026-07-16",
      title: "Meeting workflows",
      goal: "Choose a meeting assistant for consent-aware client calls.",
      prerequisites: ["Participants can be notified before transcription starts."],
      suitableFor: "Teams that can obtain recording consent.",
      notSuitableFor: "Covert recording.",
      dimensions: [
        {
          id: "retention-days",
          label: "Maximum retention",
          valueType: "number",
          operator: "lte",
          order: 1,
          allowedValues: [
            { value: 7, label: "7 days" },
            { value: 30, label: "30 days" },
            { value: 90, label: "90 days" },
          ],
          unit: "days",
        },
        {
          id: "hosting-region",
          label: "Hosting region",
          valueType: "enum",
          operator: "eq",
          order: 2,
          allowedValues: [
            { value: "eu", label: "European Union" },
            { value: "us", label: "United States" },
          ],
        },
      ],
      candidateIds: ["candidate-meetings-beta"],
      verificationChecklist: ["Confirm recording consent controls."],
    },
  ],
  tools: [
    {
      fixture: true,
      id: "tool-alpha",
      slug: "alpha",
      status: "published",
      lastReviewedAt: "2026-07-16",
      name: "Alpha",
      summary: "Fixture writing assistant.",
      officialUrl: "https://alpha.example/",
    },
    {
      fixture: true,
      id: "tool-beta",
      slug: "beta",
      status: "published",
      lastReviewedAt: "2026-07-16",
      name: "Beta",
      summary: "Fixture meeting assistant.",
      officialUrl: "https://beta.example/",
    },
  ],
  candidates: [
    {
      fixture: true,
      id: "candidate-writing-alpha",
      scenarioId: "scenario-writing",
      toolId: "tool-alpha",
      limitation: "Fixture evidence covers only the documented team plan.",
      handsOnState: "partially_tested",
      claimBindings: {
        "commercial-use": { subjectType: "candidate", claimKey: "commercial-use" },
        "export-formats": { subjectType: "candidate", claimKey: "export-formats" },
      },
    },
    {
      fixture: true,
      id: "candidate-meetings-beta",
      scenarioId: "scenario-meetings",
      toolId: "tool-beta",
      limitation: "Fixture evidence covers only calls hosted in the selected region.",
      handsOnState: "not_tested",
      claimBindings: {
        "retention-days": { subjectType: "candidate", claimKey: "retention-days" },
        "hosting-region": { subjectType: "candidate", claimKey: "hosting-region" },
      },
    },
  ],
  sources: [
    {
      fixture: true,
      id: "source-writing-commercial",
      subjectType: "candidate",
      subjectId: "candidate-writing-alpha",
      claimKey: "commercial-use",
      sourceType: "official_legal",
      sourceUrl: "https://alpha.example/terms",
      observedValue: true,
      scope: { plan: "team", region: "global" },
      lastCheckedAt: "2026-07-16",
    },
    {
      fixture: true,
      id: "source-writing-export",
      subjectType: "candidate",
      subjectId: "candidate-writing-alpha",
      claimKey: "export-formats",
      sourceType: "official_documentation",
      sourceUrl: "https://alpha.example/docs/export",
      observedValue: ["docx", "markdown"],
      scope: { plan: "team", platform: "web" },
      lastCheckedAt: "2026-07-16",
    },
    {
      fixture: true,
      id: "source-meetings-retention",
      subjectType: "candidate",
      subjectId: "candidate-meetings-beta",
      claimKey: "retention-days",
      sourceType: "official_documentation",
      sourceUrl: "https://beta.example/docs/retention",
      observedValue: 30,
      observedUnit: "days",
      scope: { plan: "business", region: "eu" },
      lastCheckedAt: "2026-07-16",
    },
    {
      fixture: true,
      id: "source-meetings-region",
      subjectType: "candidate",
      subjectId: "candidate-meetings-beta",
      claimKey: "hosting-region",
      sourceType: "official_documentation",
      sourceUrl: "https://beta.example/docs/regions",
      observedValue: "eu",
      scope: { plan: "business", region: "eu" },
      lastCheckedAt: "2026-07-16",
    },
  ],
  offers: [
    {
      fixture: true,
      id: "offer-alpha",
      toolId: "tool-alpha",
      affiliateUrl: "https://offers.example/alpha",
      status: "research_only",
      lastCheckedAt: "2026-07-16",
      evidenceIds: [],
      terms: "Fixture record; not eligible for an active offer call to action.",
      region: "global",
    },
  ],
};

function cloneGraph() {
  return structuredClone(baseGraph);
}

async function readCollection<T>(name: string) {
  const file = new URL(`../src/content/${name}/index.json`, import.meta.url);
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function readPublicationHistory() {
  const file = new URL("../src/content/publication-history.json", import.meta.url);
  return publicationHistorySchema.parse(JSON.parse(await readFile(file, "utf8")));
}

async function readBasePublicationHistory() {
  try {
    const { stdout } = await execFileAsync("git", ["show", "origin/main:src/content/publication-history.json"], {
      cwd: new URL("..", import.meta.url),
    });
    return publicationHistorySchema.parse(JSON.parse(stdout));
  } catch (error) {
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error ? String(error.stderr) : "";
    if (stderr.includes("exists on disk, but not in 'origin/main'")) {
      return publicationHistorySchema.parse([]);
    }
    throw error;
  }
}

describe("authoritative content schema", () => {
  it("accepts legal heterogeneous Scenario fixtures", () => {
    const graph = parseContentGraph(baseGraph);

    expect(graph.scenarios).toHaveLength(2);
    expect(graph.scenarios[0]?.dimensions.map((dimension) => dimension.valueType)).toEqual([
      "boolean",
      "enum-set",
    ]);
    expect(graph.scenarios[1]?.dimensions.map((dimension) => dimension.operator)).toEqual(["lte", "eq"]);
  });

  it("loads the checked-in collections and proves Scenario-local dimension structures", async () => {
    const graph = parseContentGraph(
      {
        scenarios: await readCollection("scenarios"),
        tools: await readCollection("tools"),
        candidates: await readCollection("candidates"),
        sources: await readCollection("sources"),
        offers: await readCollection("offers"),
      },
      { publicationHistory: await readPublicationHistory() },
    );
    const dimensionSignatures = graph.scenarios.map((scenario) =>
      scenario.dimensions.map(({ valueType, operator }) => `${valueType}:${operator}`).join(","),
    );

    expect(new Set(dimensionSignatures).size).toBe(graph.scenarios.length);
    expect(graph.scenarios.every((scenario) => scenario.fixture)).toBe(true);
  });

  it("rejects incompatible operators, invalid dates, URLs, lifecycle, hands-on, and Offer states", () => {
    expect(() =>
      scenarioSchema.parse({
        ...baseGraph.scenarios[0],
        dimensions: [
          {
            id: "commercial-use",
            label: "Commercial use",
            valueType: "boolean",
            operator: "contains",
            order: 1,
          },
        ],
      }),
    ).toThrow(/boolean dimensions support only the eq operator/i);
    expect(() => toolSchema.parse({ ...baseGraph.tools[0], officialUrl: "http://alpha.example" })).toThrow(
      /https/i,
    );
    expect(() => toolSchema.parse({ ...baseGraph.tools[0], lastReviewedAt: "2026-02-30" })).toThrow(
      /valid ISO calendar date/i,
    );
    expect(() => toolSchema.parse({ ...baseGraph.tools[0], status: "blocked" })).toThrow();
    expect(() => candidateSchema.parse({ ...baseGraph.candidates[0], handsOnState: "reviewed" })).toThrow();
    expect(() => offerSchema.parse({ ...baseGraph.offers[0], status: "discount" })).toThrow();
    expect(() => sourceSchema.parse({ ...baseGraph.sources[0], sourceUrl: "javascript:alert(1)" })).toThrow(
      /https/i,
    );
  });

  it("preserves first-publication lifecycle semantics", () => {
    expect(() =>
      toolSchema.parse({
        ...baseGraph.tools[0],
        fixture: false,
        status: "published",
      }),
    ).toThrow(/required when non-fixture content is published/i);
    expect(() =>
      toolSchema.parse({
        ...baseGraph.tools[0],
        status: "retired",
      }),
    ).toThrow(/previously published/i);
    expect(() =>
      toolSchema.parse({
        ...baseGraph.tools[0],
        status: "draft",
        replacementSlug: "beta",
      }),
    ).toThrow(/only when status is retired/i);
  });

  it("rejects changes to published IDs, slugs, and firstPublishedAt", () => {
    const graph = cloneGraph();
    graph.tools[0] = {
      ...graph.tools[0]!,
      fixture: false,
      firstPublishedAt: "2026-07-10",
    };
    const publicationHistory = [
      {
        recordType: "tool" as const,
        id: "tool-alpha",
        slug: "alpha",
        firstPublishedAt: "2026-07-10",
      },
    ];

    expect(parseContentGraph(graph, { publicationHistory }).tools[0]?.slug).toBe("alpha");

    const changedSlug = cloneGraph();
    changedSlug.tools[0] = {
      ...changedSlug.tools[0]!,
      fixture: false,
      slug: "alpha-renamed",
      firstPublishedAt: "2026-07-10",
    };
    expect(() => parseContentGraph(changedSlug, { publicationHistory })).toThrow(/cannot change published slug "alpha"/);

    const changedDate = cloneGraph();
    changedDate.tools[0] = {
      ...changedDate.tools[0]!,
      fixture: false,
      firstPublishedAt: "2026-07-11",
    };
    expect(() => parseContentGraph(changedDate, { publicationHistory })).toThrow(/cannot change immutable firstPublishedAt/);

    const changedId = cloneGraph();
    changedId.tools[0] = {
      ...changedId.tools[0]!,
      fixture: false,
      id: "tool-alpha-renamed",
      firstPublishedAt: "2026-07-10",
    };
    changedId.candidates[0]!.toolId = "tool-alpha-renamed";
    changedId.offers[0]!.toolId = "tool-alpha-renamed";
    expect(() => parseContentGraph(changedId, { publicationHistory })).toThrow(/published tool "tool-alpha" must remain present/);
  });

  it("keeps the checked-in publication ledger append-only relative to main", async () => {
    const previous = await readBasePublicationHistory();
    const current = await readPublicationHistory();

    expect(validatePublicationHistoryEvolution(previous, current)).toEqual([]);
    expect(
      validatePublicationHistoryEvolution(
        [
          {
            recordType: "tool",
            id: "published-tool",
            slug: "published-tool",
            firstPublishedAt: "2026-07-10",
          },
        ],
        [
          {
            recordType: "tool",
            id: "published-tool",
            slug: "renamed-tool",
            firstPublishedAt: "2026-07-10",
          },
        ],
      ),
    ).toEqual([
      expect.objectContaining({ message: 'cannot change published slug "published-tool"' }),
    ]);
  });

  it("rejects missing references and identifies the record plus actionable field", () => {
    const graph = cloneGraph();
    graph.candidates[0]!.toolId = "tool-missing";

    expect(() => parseContentGraph(graph)).toThrow(
      /candidates\[candidate-writing-alpha\]\.toolId: referenced Tool "tool-missing" does not exist/,
    );
  });

  it("rejects wrong-Scenario claim bindings and non-fixture dependencies", () => {
    const wrongScope = cloneGraph();
    wrongScope.candidates[0]!.claimBindings = {
      "retention-days": { subjectType: "candidate", claimKey: "retention-days" },
    };
    expect(() => parseContentGraph(wrongScope)).toThrow(
      /dimension "retention-days" does not belong to Scenario "scenario-writing"/,
    );

    const mixedProvenance = cloneGraph();
    mixedProvenance.scenarios[0]!.fixture = false;
    mixedProvenance.scenarios[0]!.status = "draft";
    expect(() => parseContentGraph(mixedProvenance)).toThrow(/non-fixture Scenario cannot reference fixture Candidate/i);
  });

  it("closes fixture Source and replacement escape paths", () => {
    const sourceEscape = cloneGraph();
    sourceEscape.scenarios[0]!.fixture = false;
    sourceEscape.scenarios[0]!.status = "draft";
    sourceEscape.candidates[0]!.fixture = false;
    sourceEscape.tools[0]!.fixture = false;
    sourceEscape.candidates[0]!.claimBindings["commercial-use"] = {
      subjectType: "tool",
      claimKey: "commercial-use",
    };
    sourceEscape.sources[0]!.subjectType = "tool";
    sourceEscape.sources[0]!.subjectId = "tool-alpha";
    expect(() => parseContentGraph(sourceEscape)).toThrow(/Source and subject must have matching fixture provenance/);

    const replacementEscape = cloneGraph();
    replacementEscape.scenarios[0] = {
      ...replacementEscape.scenarios[0]!,
      fixture: false,
      status: "retired",
      firstPublishedAt: "2026-07-10",
      replacementSlug: "meeting-workflows",
    };
    replacementEscape.candidates[0]!.fixture = false;
    replacementEscape.tools[0]!.fixture = false;
    replacementEscape.sources[0]!.fixture = false;
    replacementEscape.sources[1]!.fixture = false;
    expect(() =>
      parseContentGraph(replacementEscape, {
        publicationHistory: [
          {
            recordType: "scenario",
            id: "scenario-writing",
            slug: "writing-workflows",
            firstPublishedAt: "2026-07-10",
          },
        ],
      }),
    ).toThrow(/replacement must have matching fixture provenance/);
  });

  it("validates observed values and units against their Scenario dimension", () => {
    const wrongValue = cloneGraph();
    wrongValue.sources.find((source) => source.id === "source-meetings-retention")!.observedValue = "thirty";
    expect(() => parseContentGraph(wrongValue)).toThrow(/must be a finite number for Dimension "retention-days"/);

    const wrongUnit = cloneGraph();
    wrongUnit.sources.find((source) => source.id === "source-meetings-retention")!.observedUnit = "hours";
    expect(() => parseContentGraph(wrongUnit)).toThrow(/must use unit "days"/);
  });

  it("rejects Source claims that do not resolve through a Candidate binding", () => {
    const graph = cloneGraph();
    graph.sources[0]!.claimKey = "unbound-claim";

    expect(() => parseContentGraph(graph)).toThrow(/claim does not resolve through any Scenario Candidate binding/);
  });

  it("requires Offer Source claims and values to resolve to Offer fields", () => {
    const graph = cloneGraph();
    graph.offers[0]!.evidenceIds = ["source-offer-alpha"];
    graph.sources.push({
      fixture: true,
      id: "source-offer-alpha",
      subjectType: "offer",
      subjectId: "offer-alpha",
      claimKey: "discount",
      sourceType: "official_pricing",
      sourceUrl: "https://offers.example/alpha/terms",
      observedValue: "20-percent",
      scope: { region: "global" },
      lastCheckedAt: "2026-07-16",
    });

    expect(() => parseContentGraph(graph)).toThrow(/claimKey must resolve to status, terms, or region/);

    graph.sources.at(-1)!.claimKey = "status";
    graph.sources.at(-1)!.observedValue = "verified_deal";
    expect(() => parseContentGraph(graph)).toThrow(/must equal the Offer status value "research_only"/);

    graph.sources.at(-1)!.observedValue = "research_only";
    expect(parseContentGraph(graph).offers[0]?.id).toBe("offer-alpha");
  });

  it("formats multiple validation failures in byte-stable order", () => {
    const graph = cloneGraph();
    graph.candidates[0]!.toolId = "tool-missing";
    graph.sources[0]!.claimKey = "unbound-claim";

    const capture = () => {
      try {
        parseContentGraph(graph);
      } catch (error) {
        return (error as Error).message;
      }
      throw new Error("expected validation failure");
    };
    const first = capture();
    const second = capture();
    const details = first.split("\n").slice(1);

    expect(first).toBe(second);
    expect(details).toEqual([...details].sort());
  });

  it("keeps Offer fields structurally outside Scenario Candidate eligibility", () => {
    expect(() =>
      candidateSchema.parse({
        ...baseGraph.candidates[0],
        offerId: "offer-alpha",
        affiliateUrl: "https://offers.example/alpha",
      }),
    ).toThrow(/unrecognized key/i);
  });
});
