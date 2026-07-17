import type { ContentGraph } from "../content/schema";
import type { BuildTarget, PublicationIssue, ScenarioPublicationOutcome, ToolPublicationOutcome } from "./model";
import {
  fixtureExcluded,
  publicationIssue,
  sortPublicationIssues,
  validateReplacement,
} from "./publication-helpers";

export function assembleToolOutcomes(
  graph: ContentGraph,
  scenarioOutcomes: readonly ScenarioPublicationOutcome[],
  target: BuildTarget,
  referenceIssues: ReadonlyMap<string, readonly PublicationIssue[]>,
  invalidToolIds: ReadonlySet<string>,
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

  const initialOutcomes = [...graph.tools]
    .sort((left, right) => left.slug.localeCompare(right.slug, "en"))
    .map((tool): ToolPublicationOutcome => {
      if (fixtureExcluded(tool.fixture, target)) {
        return { kind: "hidden", id: tool.id, slug: tool.slug, fixture: true, reason: "fixture_excluded" };
      }
      if (invalidToolIds.has(tool.id)) {
        return { kind: "hidden", id: tool.id, slug: tool.slug, fixture: tool.fixture, reason: "invalid" };
      }
      if (tool.status === "draft") {
        if (tool.firstPublishedAt) {
          const issues = [
            ...(referenceIssues.get(tool.id) ?? []),
            publicationIssue(
              "temporarily_withdrawn",
              `tools[${tool.id}].status`,
              "previously published Tool is currently withdrawn",
            ),
          ];
          return {
            kind: "blocked",
            id: tool.id,
            slug: tool.slug,
            fixture: tool.fixture,
            name: tool.name,
            firstPublishedAt: tool.firstPublishedAt,
            issues: sortPublicationIssues(issues),
          };
        }
        return { kind: "hidden", id: tool.id, slug: tool.slug, fixture: tool.fixture, reason: "draft" };
      }
      if (tool.status === "retired") {
        if (!tool.firstPublishedAt) {
          return {
            kind: "hidden",
            id: tool.id,
            slug: tool.slug,
            fixture: tool.fixture,
            reason: "never_published",
          };
        }
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

      const validationIssues = referenceIssues.get(tool.id) ?? [];
      if (validationIssues.length > 0) {
        return {
          kind: "blocked",
          id: tool.id,
          slug: tool.slug,
          fixture: tool.fixture,
          name: tool.name,
          firstPublishedAt: tool.firstPublishedAt,
          issues: sortPublicationIssues(validationIssues),
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

  const outcomesBySlug = new Map(initialOutcomes.map((outcome) => [outcome.slug, outcome]));
  return initialOutcomes.map((outcome): ToolPublicationOutcome => {
    if (outcome.kind !== "replacement") return outcome;
    const targetOutcome = outcomesBySlug.get(outcome.redirectTo.slug);
    if (targetOutcome?.kind === "exposed-tool") return outcome;
    return {
      kind: "blocked",
      id: outcome.id,
      slug: outcome.slug,
      fixture: outcome.fixture,
      name: outcome.name,
      firstPublishedAt: outcome.firstPublishedAt,
      issues: [
        publicationIssue(
          "invalid_replacement",
          `tools[${outcome.id}].replacementSlug`,
          `replacement "${outcome.redirectTo.slug}" does not produce an exposed Tool outcome`,
        ),
      ],
    };
  });
}
