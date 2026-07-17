import type { ContentGraph } from "../content/schema";
import type { BuildTarget, ScenarioPublicationOutcome, ToolPublicationOutcome } from "./model";
import { fixtureExcluded, publicationIssue, validateReplacement } from "./publication-helpers";

export function assembleToolOutcomes(
  graph: ContentGraph,
  scenarioOutcomes: readonly ScenarioPublicationOutcome[],
  target: BuildTarget,
) {
  const exposedScenarioIds = new Map<string, Set<string>>();
  scenarioOutcomes.forEach((outcome) => {
    if (outcome.kind !== "published") return;
    outcome.scenario.candidates.forEach((candidate) => {
      const scenarioIds = exposedScenarioIds.get(candidate.tool.id) ?? new Set<string>();
      scenarioIds.add(outcome.id);
      exposedScenarioIds.set(candidate.tool.id, scenarioIds);
    });
  });
  const toolsBySlug = new Map(graph.tools.map((tool) => [tool.slug, tool]));

  return [...graph.tools]
    .sort((left, right) => left.slug.localeCompare(right.slug, "en"))
    .map((tool): ToolPublicationOutcome => {
      if (fixtureExcluded(tool.fixture, target)) {
        return { kind: "hidden", id: tool.id, slug: tool.slug, fixture: true, reason: "fixture_excluded" };
      }
      if (tool.status === "draft") {
        if (tool.firstPublishedAt) {
          return {
            kind: "blocked",
            id: tool.id,
            slug: tool.slug,
            fixture: tool.fixture,
            name: tool.name,
            firstPublishedAt: tool.firstPublishedAt,
            issues: [
              publicationIssue(
                "temporarily_withdrawn",
                `tools[${tool.id}].status`,
                "previously published Tool is currently withdrawn",
              ),
            ],
          };
        }
        return { kind: "hidden", id: tool.id, slug: tool.slug, fixture: tool.fixture, reason: "draft" };
      }
      if (tool.status === "retired") {
        if (!tool.replacementSlug) {
          return {
            kind: "retired",
            id: tool.id,
            slug: tool.slug,
            fixture: tool.fixture,
            name: tool.name,
            firstPublishedAt: tool.firstPublishedAt,
          };
        }
        const replacement = toolsBySlug.get(tool.replacementSlug);
        const replacementIssue = validateReplacement("tool", tool, replacement, target);
        if (replacementIssue) {
          return {
            kind: "blocked",
            id: tool.id,
            slug: tool.slug,
            fixture: tool.fixture,
            name: tool.name,
            firstPublishedAt: tool.firstPublishedAt,
            issues: [replacementIssue],
          };
        }
        return {
          kind: "replacement",
          id: tool.id,
          slug: tool.slug,
          fixture: tool.fixture,
          name: tool.name,
          firstPublishedAt: tool.firstPublishedAt,
          redirectTo: { slug: replacement!.slug, href: `/tool/${replacement!.slug}` },
          statusCode: 301,
        };
      }

      const scenarioIds = [...(exposedScenarioIds.get(tool.id) ?? [])].sort((left, right) => left.localeCompare(right, "en"));
      if (scenarioIds.length > 0) {
        return { kind: "exposed-tool", id: tool.id, slug: tool.slug, fixture: tool.fixture, tool, scenarioIds };
      }
      if (tool.firstPublishedAt) {
        return {
          kind: "blocked",
          id: tool.id,
          slug: tool.slug,
          fixture: tool.fixture,
          name: tool.name,
          firstPublishedAt: tool.firstPublishedAt,
          issues: [
            publicationIssue(
              "no_published_scenario",
              `tools[${tool.id}].scenarioIds`,
              "previously published Tool has no published Scenario relationship",
            ),
          ],
        };
      }
      return { kind: "hidden", id: tool.id, slug: tool.slug, fixture: tool.fixture, reason: "not_exposed" };
    });
}
