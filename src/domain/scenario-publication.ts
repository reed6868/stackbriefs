import type { ContentGraph, ScenarioContent } from "../content/schema";
import type {
  BlockedScenarioOutcome,
  DomainCandidate,
  DomainClaim,
  DomainScenario,
  PublicationIssue,
  PublicationOptions,
  ScenarioPublicationOutcome,
} from "./model";
import {
  fixtureExcluded,
  publicationIssue,
  sortPublicationIssues,
  sourceIsCurrent,
  validateReplacement,
} from "./publication-helpers";

function assemblePublishedScenario(
  scenario: ScenarioContent,
  graph: ContentGraph,
  options: PublicationOptions,
): ScenarioPublicationOutcome {
  const path = `scenarios[${scenario.id}]`;
  const issues: PublicationIssue[] = [];
  const candidatesById = new Map(graph.candidates.map((candidate) => [candidate.id, candidate]));
  const toolsById = new Map(graph.tools.map((tool) => [tool.id, tool]));
  const domainCandidates: DomainCandidate[] = [];

  if (!scenario.fixture && scenario.candidateIds.length < 3) {
    issues.push(
      publicationIssue("insufficient_candidates", `${path}.candidateIds`, "published Scenario requires at least three candidates"),
    );
  }
  if (!scenario.fixture && (scenario.dimensions.length < 4 || scenario.dimensions.length > 7)) {
    issues.push(
      publicationIssue("invalid_dimension_count", `${path}.dimensions`, "published Scenario requires 4–7 dimensions"),
    );
  }

  scenario.candidateIds.forEach((candidateId) => {
    const candidatePath = `${path}.candidates[${candidateId}]`;
    const candidate = candidatesById.get(candidateId);
    if (!candidate || candidate.scenarioId !== scenario.id || (!scenario.fixture && candidate.fixture)) {
      issues.push(
        publicationIssue(
          "missing_candidate",
          `${candidatePath}.id`,
          `Candidate "${candidateId}" does not resolve within Scenario "${scenario.id}"`,
        ),
      );
      return;
    }

    const tool = toolsById.get(candidate.toolId);
    if (!tool) {
      issues.push(
        publicationIssue("missing_tool", `${candidatePath}.toolId`, `referenced Tool "${candidate.toolId}" does not exist`),
      );
      return;
    }
    if (tool.status !== "published" || (!scenario.fixture && tool.fixture)) {
      issues.push(
        publicationIssue(
          "inactive_tool",
          `${candidatePath}.toolId`,
          `Tool "${tool.id}" must be an active published Tool with compatible fixture provenance`,
        ),
      );
      return;
    }

    const claims: DomainClaim[] = [];
    scenario.dimensions.forEach((dimension) => {
      const claimPath = `${candidatePath}.claims[${dimension.id}]`;
      const binding = candidate.claimBindings[dimension.id];
      if (!binding) {
        issues.push(
          publicationIssue("missing_claim_binding", claimPath, `Dimension "${dimension.id}" has no Candidate claim binding`),
        );
        return;
      }

      const subjectId = binding.subjectType === "candidate" ? candidate.id : tool.id;
      const sources = graph.sources
        .filter(
          (source) =>
            source.subjectType === binding.subjectType &&
            source.subjectId === subjectId &&
            source.claimKey === binding.claimKey &&
            source.fixture === candidate.fixture,
        )
        .sort((left, right) => left.id.localeCompare(right.id, "en"));
      if (sources.length === 0) {
        issues.push(
          publicationIssue("missing_gating_evidence", claimPath, `Dimension "${dimension.id}" has no supporting Source`),
        );
        return;
      }
      if (!sources.some((source) => sourceIsCurrent(source, options.asOf))) {
        issues.push(
          publicationIssue(
            "stale_gating_claim",
            claimPath,
            `Dimension "${dimension.id}" has no Source current at ${options.asOf}`,
          ),
        );
      }
      claims.push({
        dimensionId: dimension.id,
        dimension,
        subjectType: binding.subjectType,
        subjectId,
        claimKey: binding.claimKey,
        sources,
      });
    });

    domainCandidates.push({
      fixture: candidate.fixture,
      id: candidate.id,
      scenarioId: candidate.scenarioId,
      toolId: candidate.toolId,
      limitation: candidate.limitation,
      handsOnState: candidate.handsOnState,
      tool,
      claims,
    });
  });

  if (issues.length > 0) {
    return {
      kind: "blocked",
      id: scenario.id,
      slug: scenario.slug,
      fixture: scenario.fixture,
      title: scenario.title,
      firstPublishedAt: scenario.firstPublishedAt,
      issues: sortPublicationIssues(issues),
    } satisfies BlockedScenarioOutcome;
  }

  const { candidateIds: _candidateIds, ...scenarioFields } = scenario;
  const domainScenario: DomainScenario = { ...scenarioFields, candidates: domainCandidates };
  return { kind: "published", id: scenario.id, slug: scenario.slug, fixture: scenario.fixture, scenario: domainScenario };
}

export function assembleScenarioOutcomes(graph: ContentGraph, options: PublicationOptions) {
  const scenariosBySlug = new Map(graph.scenarios.map((scenario) => [scenario.slug, scenario]));

  return [...graph.scenarios]
    .sort((left, right) => left.slug.localeCompare(right.slug, "en"))
    .map((scenario): ScenarioPublicationOutcome => {
      if (fixtureExcluded(scenario.fixture, options.target)) {
        return { kind: "hidden", id: scenario.id, slug: scenario.slug, fixture: true, reason: "fixture_excluded" };
      }
      if (scenario.status === "draft") {
        if (scenario.firstPublishedAt) {
          return {
            kind: "blocked",
            id: scenario.id,
            slug: scenario.slug,
            fixture: scenario.fixture,
            title: scenario.title,
            firstPublishedAt: scenario.firstPublishedAt,
            issues: [
              publicationIssue(
                "temporarily_withdrawn",
                `scenarios[${scenario.id}].status`,
                "previously published Scenario is currently withdrawn",
              ),
            ],
          };
        }
        return { kind: "hidden", id: scenario.id, slug: scenario.slug, fixture: scenario.fixture, reason: "draft" };
      }
      if (scenario.status === "retired") {
        if (!scenario.replacementSlug) {
          return {
            kind: "retired",
            id: scenario.id,
            slug: scenario.slug,
            fixture: scenario.fixture,
            title: scenario.title,
            firstPublishedAt: scenario.firstPublishedAt,
          };
        }
        const replacement = scenariosBySlug.get(scenario.replacementSlug);
        const replacementIssue = validateReplacement("scenario", scenario, replacement, options.target);
        if (replacementIssue) {
          return {
            kind: "blocked",
            id: scenario.id,
            slug: scenario.slug,
            fixture: scenario.fixture,
            title: scenario.title,
            firstPublishedAt: scenario.firstPublishedAt,
            issues: [replacementIssue],
          };
        }
        return {
          kind: "replacement",
          id: scenario.id,
          slug: scenario.slug,
          fixture: scenario.fixture,
          title: scenario.title,
          firstPublishedAt: scenario.firstPublishedAt,
          redirectTo: { slug: replacement!.slug, href: `/decision/${replacement!.slug}` },
          statusCode: 301,
        };
      }
      return assemblePublishedScenario(scenario, graph, options);
    });
}
