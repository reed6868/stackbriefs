import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import {
  projectLifecycleRedirects,
  projectScenarioRoutePaths,
  projectToolRoutePaths,
} from "../src/domain/lifecycle-routes";
import type {
  PublicationAssembly,
  ScenarioPublicationOutcome,
  ToolPublicationOutcome,
} from "../src/domain/model";
import { assemblePublication } from "../src/domain/publication";

async function readCollection<Name extends keyof ContentGraph>(name: Name): Promise<ContentGraph[Name]> {
  return JSON.parse(await readFile(new URL(`../src/content/${name}/index.json`, import.meta.url), "utf8"));
}

async function baselinePublication() {
  return assemblePublication({
    scenarios: await readCollection("scenarios"),
    tools: await readCollection("tools"),
    candidates: await readCollection("candidates"),
    sources: await readCollection("sources"),
    offers: await readCollection("offers"),
  }, { target: "development", asOf: "2026-07-17" });
}

function withOutcomes(
  baseline: PublicationAssembly,
  scenarioOutcomes: readonly ScenarioPublicationOutcome[],
  toolOutcomes: readonly ToolPublicationOutcome[],
): PublicationAssembly {
  return { ...baseline, scenarioOutcomes, toolOutcomes };
}

describe("lifecycle route projection", () => {
  it("generates published and previously published status routes while omitting hidden records", async () => {
    const baseline = await baselinePublication();
    const publishedScenario = baseline.scenarioOutcomes.find((outcome) => outcome.kind === "published")!;
    const exposedTool = baseline.toolOutcomes.find((outcome) => outcome.kind === "exposed-tool")!;
    const scenarios: ScenarioPublicationOutcome[] = [
      publishedScenario,
      { kind: "hidden", id: "scenario-draft", slug: "draft", fixture: true, reason: "draft" },
      {
        kind: "blocked",
        id: "scenario-never-published-blocked",
        slug: "never-published-blocked",
        fixture: true,
        title: "Never published blocked Scenario",
        issues: [],
      },
      {
        kind: "blocked",
        id: "scenario-blocked",
        slug: "blocked-scenario",
        fixture: true,
        title: "Blocked Scenario",
        firstPublishedAt: "2026-07-10",
        issues: [{ code: "fixture", path: "scenario", message: "withheld" }],
      },
      {
        kind: "retired",
        id: "scenario-retired",
        slug: "retired-scenario",
        fixture: true,
        title: "Retired Scenario",
        firstPublishedAt: "2026-07-10",
      },
      {
        kind: "replacement",
        id: "scenario-replaced",
        slug: "replaced-scenario",
        fixture: true,
        title: "Replaced Scenario",
        firstPublishedAt: "2026-07-10",
        redirectTo: { slug: publishedScenario.slug, href: `/decision/${publishedScenario.slug}` },
        statusCode: 301,
      },
    ];
    const tools: ToolPublicationOutcome[] = [
      exposedTool,
      { kind: "hidden", id: "tool-draft", slug: "draft-tool", fixture: true, reason: "draft" },
      {
        kind: "blocked",
        id: "tool-never-published-blocked",
        slug: "never-published-tool",
        fixture: true,
        name: "Never published Tool",
        issues: [],
      },
      {
        kind: "blocked",
        id: "tool-blocked",
        slug: "blocked-tool",
        fixture: true,
        name: "Blocked Tool",
        firstPublishedAt: "2026-07-10",
        issues: [{ code: "fixture", path: "tool", message: "withheld" }],
      },
      {
        kind: "retired",
        id: "tool-retired",
        slug: "retired-tool",
        fixture: true,
        name: "Retired Tool",
        firstPublishedAt: "2026-07-10",
      },
      {
        kind: "replacement",
        id: "tool-replaced",
        slug: "replaced-tool",
        fixture: true,
        name: "Replaced Tool",
        firstPublishedAt: "2026-07-10",
        redirectTo: { slug: exposedTool.slug, href: `/tool/${exposedTool.slug}` },
        statusCode: 301,
      },
    ];
    const publication = withOutcomes(baseline, scenarios, tools);

    const scenarioPaths = projectScenarioRoutePaths(publication);
    expect(scenarioPaths.map((path) => path.params.scenario)).toEqual([
      "meeting-assistants",
      "blocked-scenario",
      "retired-scenario",
    ]);
    expect(scenarioPaths.find((path) => path.params.scenario === "blocked-scenario")?.props.route)
      .toMatchObject({ kind: "status", status: "blocked", noindex: true });
    expect(scenarioPaths.find((path) => path.params.scenario === "retired-scenario")?.props.route)
      .toMatchObject({ kind: "status", status: "retired", noindex: true });

    const toolPaths = projectToolRoutePaths(publication);
    expect(toolPaths.map((path) => path.params.slug)).toEqual([
      "alpha-writer",
      "blocked-tool",
      "retired-tool",
    ]);
    expect(toolPaths.find((path) => path.params.slug === "blocked-tool")?.props.route)
      .toMatchObject({ kind: "status", status: "blocked", noindex: true });
    expect(toolPaths.find((path) => path.params.slug === "retired-tool")?.props.route)
      .toMatchObject({ kind: "status", status: "retired", noindex: true });

    expect(projectLifecycleRedirects(publication)).toEqual([
      { from: "/decision/replaced-scenario", to: `/decision/${publishedScenario.slug}`, statusCode: 301 },
      { from: "/tool/replaced-tool", to: `/tool/${exposedTool.slug}`, statusCode: 301 },
    ]);
  });

  it("keeps unrelated published routes available when another record is blocked", async () => {
    const baseline = await baselinePublication();
    const published = baseline.scenarioOutcomes.filter((outcome) => outcome.kind === "published");
    const publication = withOutcomes(baseline, [
      published[0]!,
      {
        kind: "blocked",
        id: published[1]!.id,
        slug: published[1]!.slug,
        fixture: published[1]!.fixture,
        title: published[1]!.scenario.title,
        firstPublishedAt: "2026-07-10",
        issues: [{ code: "fixture", path: "scenario", message: "withheld" }],
      },
    ], baseline.toolOutcomes);

    expect(projectScenarioRoutePaths(publication).map((path) => path.params.scenario)).toEqual([
      published[0]!.slug,
      published[1]!.slug,
    ]);
    expect(projectScenarioRoutePaths(publication)[0]!.props.route.kind).toBe("published");
    expect(projectScenarioRoutePaths(publication)[1]!.props.route.kind).toBe("status");
  });
});
