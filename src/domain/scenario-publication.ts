import type { ContentGraph, ScenarioContent } from "../content/schema";
import type {
  BlockedScenarioOutcome,
  DomainCandidate,
  DomainClaim,
  DomainScenario,
  GatingClaimReadiness,
  PublicationIssue,
  PublicationOptions,
  ScenarioPublicationOutcome,
} from "./model";
import {
  fixtureExcluded,
  publicationIssue,
  sortPublicationIssues,
  validateReplacement,
} from "./publication-helpers";

function assemblePublishedScenario(
  scenario: ScenarioContent,
  graph: ContentGraph,
  options: PublicationOptions,
  referenceIssues: readonly PublicationIssue[],
): ScenarioPublicationOutcome {
  const path = `scenarios[${scenario.id}]`;
  const issues: PublicationIssue[] = [...referenceIssues];
  const candidatesById = new Map(graph.candidates.map((candidate) => [candidate.id, candidate]));
  const toolsById = new Map(graph.tools.map((tool) => [tool.id, tool]));
  const domainCandidates: DomainCandidate[] = [];
  const readinessByClaim = new Map(
    (options.gatingClaims ?? []).map((readiness) => [`${readiness.candidateId}:${readiness.dimensionId}`, readiness]),
  );

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
      const readiness = readinessByClaim.get(`${candidate.id}:${dimension.id}`) as GatingClaimReadiness | undefined;
      if (readiness?.state === "stale") {
        issues.push(
          publicationIssue(
            "stale_gating_claim",
            claimPath,
            `Dimension "${dimension.id}" is stale: ${readiness.reason}`,
          ),
        );
      } else if (readiness?.state === "missing") {
        issues.push(
          publicationIssue(
            "missing_gating_evidence",
            claimPath,
            `Dimension "${dimension.id}" is unresolved: ${readiness.reason}`,
          ),
        );
      } else if (!scenario.fixture && readiness?.state !== "current") {
        issues.push(
          publicationIssue(
            "unresolved_gating_claim",
            claimPath,
            `Dimension "${dimension.id}" requires a current evidence-readiness result before publication`,
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

export function assembleScenarioOutcomes(
  graph: ContentGraph,
  options: PublicationOptions,
  referenceIssues: ReadonlyMap<string, readonly PublicationIssue[]>,
  invalidScenarioIds: ReadonlySet<string>,
) {
  const scenariosBySlug = new Map(graph.scenarios.map((scenario) => [scenario.slug, scenario]));

  const initialOutcomes = [...graph.scenarios]
    .sort((left, right) => left.slug.localeCompare(right.slug, "en"))
    .map((scenario): ScenarioPublicationOutcome => {
      if (fixtureExcluded(scenario.fixture, options.target)) {
        return { kind: "hidden", id: scenario.id, slug: scenario.slug, fixture: true, reason: "fixture_excluded" };
      }
      if (invalidScenarioIds.has(scenario.id)) {
        return { kind: "hidden", id: scenario.id, slug: scenario.slug, fixture: scenario.fixture, reason: "invalid" };
      }
      if (scenario.status === "draft") {
        if (scenario.firstPublishedAt) {
          const issues = [
            ...(referenceIssues.get(scenario.id) ?? []),
            publicationIssue(
              "temporarily_withdrawn",
              `scenarios[${scenario.id}].status`,
              "previously published Scenario is currently withdrawn",
            ),
          ];
          return {
            kind: "blocked",
            id: scenario.id,
            slug: scenario.slug,
            fixture: scenario.fixture,
            title: scenario.title,
            firstPublishedAt: scenario.firstPublishedAt,
            issues: sortPublicationIssues(issues),
          };
        }
        return { kind: "hidden", id: scenario.id, slug: scenario.slug, fixture: scenario.fixture, reason: "draft" };
      }
      if (scenario.status === "retired") {
        if (!scenario.firstPublishedAt) {
          return {
            kind: "hidden",
            id: scenario.id,
            slug: scenario.slug,
            fixture: scenario.fixture,
            reason: "never_published",
          };
        }
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
      return assemblePublishedScenario(scenario, graph, options, referenceIssues.get(scenario.id) ?? []);
    });

  const outcomesBySlug = new Map(initialOutcomes.map((outcome) => [outcome.slug, outcome]));
  return initialOutcomes.map((outcome): ScenarioPublicationOutcome => {
    if (outcome.kind !== "replacement") return outcome;
    const target = outcomesBySlug.get(outcome.redirectTo.slug);
    if (target?.kind === "published") return outcome;
    return {
      kind: "blocked",
      id: outcome.id,
      slug: outcome.slug,
      fixture: outcome.fixture,
      title: outcome.title,
      firstPublishedAt: outcome.firstPublishedAt,
      issues: [
        publicationIssue(
          "invalid_replacement",
          `scenarios[${outcome.id}].replacementSlug`,
          `replacement "${outcome.redirectTo.slug}" does not produce a published Scenario outcome`,
        ),
      ],
    };
  });
}
