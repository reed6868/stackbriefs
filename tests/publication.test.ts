import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import { assemblePublication, type PublicationAssembly } from "../src/domain/publication";

async function readCollection<Name extends keyof ContentGraph>(name: Name): Promise<ContentGraph[Name]> {
  const file = new URL(`../src/content/${name}/index.json`, import.meta.url);
  return JSON.parse(await readFile(file, "utf8")) as ContentGraph[Name];
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

function cloneGraph(graph: ContentGraph) {
  return structuredClone(graph);
}

function scenarioOutcome(assembly: PublicationAssembly, slug: string) {
  const outcome = assembly.scenarioOutcomes.find((item) => item.slug === slug);
  expect(outcome, `Scenario outcome for ${slug}`).toBeDefined();
  return outcome!;
}

const development = { target: "development", asOf: "2026-07-17" } as const;

describe("publication assembly", () => {
  it("assembles validated collections into framework-independent Domain objects", async () => {
    const assembly = assemblePublication(await loadGraph(), development);
    const writing = scenarioOutcome(assembly, "writing-assistants");

    expect(writing.kind).toBe("published");
    if (writing.kind !== "published") return;
    expect(writing.scenario.candidates.map((candidate) => candidate.tool.name)).toEqual([
      "Alpha Writer",
      "Bravo Draft",
    ]);
    expect(writing.scenario.candidates[0]?.claims.map((claim) => claim.dimensionId)).toEqual([
      "commercial-use",
      "export-formats",
      "collaboration-mode",
    ]);
    expect(writing.scenario.candidates[0]?.claims[0]?.sources[0]?.id).toBe("source-writing-alpha-commercial");
    expect(writing.scenario.candidates[0]?.claims[0]?.evidence).toMatchObject({ state: "verified_fact", value: true });
    expect(JSON.stringify(writing.scenario)).not.toMatch(/affiliateUrl|offer-alpha|research_only/);
  });

  it("retains fixtures in Development and Preview but excludes them from every Production input", async () => {
    const graph = await loadGraph();
    const developmentAssembly = assemblePublication(graph, development);
    const previewAssembly = assemblePublication(graph, { ...development, target: "preview" });
    const productionAssembly = assemblePublication(graph, { ...development, target: "production" });

    expect(developmentAssembly.publicInputs.discoveryScenarioSlugs).toEqual([
      "meeting-assistants",
      "writing-assistants",
    ]);
    expect(previewAssembly.publicInputs.decisionRouteSlugs).toEqual(
      developmentAssembly.publicInputs.decisionRouteSlugs,
    );
    expect(productionAssembly.publicInputs).toEqual({
      discoveryScenarioSlugs: [],
      decisionRouteSlugs: [],
      statusScenarioSlugs: [],
      scenarioRedirects: [],
      exposedToolSlugs: [],
      statusToolSlugs: [],
      toolRedirects: [],
      sitemapPaths: [],
      structuredDataPaths: [],
      indexable: true,
    });
    expect(productionAssembly.scenarioOutcomes.every((outcome) => outcome.kind === "hidden")).toBe(true);
    expect(productionAssembly.issues).toContainEqual(
      expect.objectContaining({ code: "production_requires_published_scenario" }),
    );
  });

  it("blocks only the Scenario with a broken reference", async () => {
    const graph = await loadGraph();
    graph.candidates.find((candidate) => candidate.id === "candidate-writing-alpha")!.toolId = "tool-missing";

    const assembly = assemblePublication(graph, development);
    const writing = scenarioOutcome(assembly, "writing-assistants");
    const meetings = scenarioOutcome(assembly, "meeting-assistants");

    expect(writing.kind).toBe("blocked");
    expect(meetings.kind).toBe("published");
    if (writing.kind === "blocked") {
      expect(writing.issues).toContainEqual(
        expect.objectContaining({
          code: "missing_tool",
          path: "scenarios[scenario-writing-assistants].candidates[candidate-writing-alpha].toolId",
        }),
      );
    }
    expect(assembly.publicInputs.discoveryScenarioSlugs).toEqual(["meeting-assistants"]);
  });

  it("blocks a published Scenario when a Candidate Tool is inactive", async () => {
    const graph = await loadGraph();
    graph.tools.find((tool) => tool.id === "tool-alpha")!.status = "draft";

    const assembly = assemblePublication(graph, development);
    const writing = scenarioOutcome(assembly, "writing-assistants");

    expect(writing.kind).toBe("blocked");
    if (writing.kind === "blocked") {
      expect(writing.issues).toContainEqual(
        expect.objectContaining({ code: "inactive_tool", message: expect.stringContaining("tool-alpha") }),
      );
    }
    expect(scenarioOutcome(assembly, "meeting-assistants").kind).toBe("published");
  });

  it("blocks stale gating claims without blocking an unrelated fresh Scenario", async () => {
    const graph = await loadGraph();
    graph.sources.find((source) => source.id === "source-writing-alpha-commercial")!.lastCheckedAt = "2026-01-01";

    const assembly = assemblePublication(graph, development);
    const writing = scenarioOutcome(assembly, "writing-assistants");

    expect(writing.kind).toBe("blocked");
    if (writing.kind === "blocked") {
      expect(writing.issues).toContainEqual(
        expect.objectContaining({ code: "stale_gating_claim", message: expect.stringContaining("commercial-use") }),
      );
    }
    expect(scenarioOutcome(assembly, "meeting-assistants").kind).toBe("published");
    expect(assembly.releaseReady).toBe(true);
  });

  it("derives draft, retired, replacement, and invalid-replacement outcomes", async () => {
    const graph = await loadGraph();
    graph.scenarios[0]!.status = "draft";
    expect(scenarioOutcome(assemblePublication(graph, development), "writing-assistants").kind).toBe("hidden");

    const retired = await loadGraph();
    retired.scenarios[0]!.status = "retired";
    expect(scenarioOutcome(assemblePublication(retired, development), "writing-assistants").kind).toBe("hidden");

    retired.scenarios[0]!.firstPublishedAt = "2026-07-10";
    retired.scenarios[0]!.replacementSlug = "meeting-assistants";
    const replacement = scenarioOutcome(assemblePublication(retired, development), "writing-assistants");
    expect(replacement).toMatchObject({
      kind: "replacement",
      redirectTo: { slug: "meeting-assistants", href: "/decision/meeting-assistants" },
      statusCode: 301,
    });

    retired.scenarios[1]!.status = "draft";
    const invalid = scenarioOutcome(assemblePublication(retired, development), "writing-assistants");
    expect(invalid.kind).toBe("blocked");
    if (invalid.kind === "blocked") {
      expect(invalid.issues).toContainEqual(expect.objectContaining({ code: "invalid_replacement" }));
    }
  });

  it("rejects a replacement whose raw record is published but final outcome is blocked", async () => {
    const graph = await loadGraph();
    graph.scenarios[0]!.status = "retired";
    graph.scenarios[0]!.firstPublishedAt = "2026-07-10";
    graph.scenarios[0]!.replacementSlug = "meeting-assistants";
    graph.tools.find((tool) => tool.id === "tool-charlie")!.status = "draft";

    const outcome = scenarioOutcome(assemblePublication(graph, development), "writing-assistants");
    expect(outcome.kind).toBe("blocked");
    if (outcome.kind === "blocked") {
      expect(outcome.issues).toContainEqual(
        expect.objectContaining({
          code: "invalid_replacement",
          message: expect.stringContaining("does not produce a published Scenario outcome"),
        }),
      );
    }
  });

  it("uses firstPublishedAt to distinguish hidden content from noindex status outcomes", async () => {
    const graph = await loadGraph();
    graph.scenarios[0] = {
      ...graph.scenarios[0]!,
      fixture: false,
      status: "draft",
      firstPublishedAt: "2026-07-10",
    };
    graph.tools[0] = {
      ...graph.tools[0]!,
      fixture: false,
      firstPublishedAt: "2026-07-10",
    };

    const assembly = assemblePublication(graph, {
      ...development,
      publicationHistory: [
        {
          recordType: "scenario",
          id: graph.scenarios[0]!.id,
          slug: graph.scenarios[0]!.slug,
          firstPublishedAt: "2026-07-10",
        },
        {
          recordType: "tool",
          id: graph.tools[0]!.id,
          slug: graph.tools[0]!.slug,
          firstPublishedAt: "2026-07-10",
        },
      ],
    });
    const writing = scenarioOutcome(assembly, "writing-assistants");

    expect(writing.kind).toBe("blocked");
    expect(assembly.publicInputs.statusScenarioSlugs).toContain("writing-assistants");
    expect(assembly.publicInputs.statusToolSlugs).toContain("alpha-writer");

    const neverPublished = await loadGraph();
    neverPublished.scenarios[0]!.status = "draft";
    const hidden = assemblePublication(neverPublished, development);
    expect(scenarioOutcome(hidden, "writing-assistants").kind).toBe("hidden");
    expect(hidden.publicInputs.statusScenarioSlugs).not.toContain("writing-assistants");
  });

  it("derives exposed Tools only from published Scenario outcomes", async () => {
    const graph = await loadGraph();
    graph.scenarios[0]!.status = "draft";
    const assembly = assemblePublication(graph, development);

    expect(assembly.toolOutcomes.filter((outcome) => outcome.kind === "exposed-tool").map((outcome) => outcome.slug)).toEqual([
      "charlie-meet",
      "delta-notes",
    ]);
    expect(assembly.publicInputs.exposedToolSlugs).toEqual(["charlie-meet", "delta-notes"]);
  });

  it("keeps broken or mutated Offers outside Scenario publication decisions", async () => {
    const graph = await loadGraph();
    const baseline = assemblePublication(graph, development);
    const brokenOffers = cloneGraph(graph);
    brokenOffers.offers[0]!.toolId = "tool-missing";
    brokenOffers.offers[0]!.affiliateUrl = "https://commercial.example/highest-commission";
    const mutated = assemblePublication(brokenOffers, development);

    expect(mutated.scenarioOutcomes).toEqual(baseline.scenarioOutcomes);
    expect(mutated.publicInputs).toEqual(baseline.publicInputs);
    expect(mutated.offerIssues).toContainEqual(expect.objectContaining({ code: "offer_missing_tool" }));
    expect(mutated.offers).toEqual([]);
  });

  it("produces stable ordering and actionable validation messages", async () => {
    const graph = await loadGraph();
    graph.candidates[0]!.toolId = "tool-missing";
    graph.sources[0]!.observedValue = "invalid-boolean";
    const reversed = {
      scenarios: [...graph.scenarios].reverse(),
      tools: [...graph.tools].reverse(),
      candidates: [...graph.candidates].reverse(),
      sources: [...graph.sources].reverse(),
      offers: [...graph.offers].reverse(),
    } satisfies ContentGraph;

    const first = assemblePublication(graph, development);
    const second = assemblePublication(reversed, development);
    const summarize = (assembly: PublicationAssembly) => ({
      scenarioOutcomes: assembly.scenarioOutcomes,
      toolOutcomes: assembly.toolOutcomes,
      publicInputs: assembly.publicInputs,
      issues: assembly.issues,
      offerIssues: assembly.offerIssues,
    });

    expect(summarize(first)).toEqual(summarize(second));
    expect(first.issues.map((issue) => issue.path)).toEqual(
      [...first.issues.map((issue) => issue.path)].sort(),
    );
  });

  it("treats a deleted publication-history identity as a global release blocker", async () => {
    const assembly = assemblePublication(await loadGraph(), {
      ...development,
      publicationHistory: [
        {
          recordType: "scenario",
          id: "deleted-published-scenario",
          slug: "reserved-scenario-slug",
          firstPublishedAt: "2026-07-10",
        },
      ],
    });

    expect(assembly.issues).toContainEqual(
      expect.objectContaining({
        code: "invalid_publication_history",
        message: expect.stringContaining('published scenario "deleted-published-scenario" must remain present'),
      }),
    );
    expect(assembly.releaseReady).toBe(false);
  });

  it("hides records that reuse reserved publication-history slugs", async () => {
    const graph = await loadGraph();
    graph.scenarios[0]!.status = "retired";
    graph.scenarios[0]!.firstPublishedAt = "2026-07-10";
    graph.tools[0]!.status = "retired";
    graph.tools[0]!.firstPublishedAt = "2026-07-10";

    const assembly = assemblePublication(graph, {
      ...development,
      publicationHistory: [
        {
          recordType: "scenario",
          id: "different-scenario-id",
          slug: graph.scenarios[0]!.slug,
          firstPublishedAt: "2026-07-10",
        },
        {
          recordType: "tool",
          id: "different-tool-id",
          slug: graph.tools[0]!.slug,
          firstPublishedAt: "2026-07-10",
        },
      ],
    });

    expect(scenarioOutcome(assembly, graph.scenarios[0]!.slug)).toMatchObject({ kind: "hidden", reason: "invalid" });
    expect(assembly.toolOutcomes.find((outcome) => outcome.id === graph.tools[0]!.id)).toMatchObject({
      kind: "hidden",
      reason: "invalid",
    });
    expect(assembly.publicInputs.statusScenarioSlugs).not.toContain(graph.scenarios[0]!.slug);
    expect(assembly.publicInputs.statusToolSlugs).not.toContain(graph.tools[0]!.slug);
    expect(assembly.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid_publication_history",
          message: expect.stringContaining("remains reserved"),
        }),
      ]),
    );
    expect(assembly.releaseReady).toBe(false);
  });

  it("keeps pure Domain modules free of Astro, DOM, browser clock, and Offer-to-decision imports", async () => {
    const domainDirectory = new URL("../src/domain/", import.meta.url);
    const filenames = (await readdir(domainDirectory)).filter((filename) => filename.endsWith(".ts"));
    const sources = await Promise.all(
      filenames.map(async (filename) => ({ filename, source: await readFile(new URL(filename, domainDirectory), "utf8") })),
    );

    for (const { source } of sources) {
      expect(source).not.toMatch(/from ["']astro|astro:content|\bdocument\b|\bwindow\b|new Date\s*\(/);
    }
    const publication = sources.find(({ filename }) => filename === "publication.ts")!.source;
    expect(publication).not.toMatch(/affiliateUrl|commission|offerValue/);
  });
});
