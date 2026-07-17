import type { DimensionContent } from "../content/schema";
import { relevantCheckDate } from "./content-evidence";
import type { ConditionEvaluationState, DecisionEvaluation } from "./decision";
import type { EvidenceState, EvidenceValue } from "./evidence-types";
import type { DomainScenario } from "./model";
import { projectShortlist, SHORTLIST_LIMIT } from "./shortlist";

export interface ComparisonColumn {
  candidateId: string;
  toolName: string;
  toolSlug: string;
  eligibility: ConditionEvaluationState;
  eligibilityLabel: string;
  limitation: string;
}

export interface ComparisonCell {
  toolSlug: string;
  value?: EvidenceValue | undefined;
  evidenceState: EvidenceState;
  lastCheckedAt?: string | undefined;
}

export interface ComparisonRow {
  dimensionId: string;
  dimension: DimensionContent;
  cells: readonly ComparisonCell[];
}

export interface ComparisonProjection {
  columns: readonly ComparisonColumn[];
  rows: readonly ComparisonRow[];
}

export function orderedScenarioDimensions(scenario: DomainScenario) {
  return [...scenario.dimensions].sort((left, right) => left.order - right.order);
}

export function projectComparison(
  scenario: DomainScenario,
  evaluation: DecisionEvaluation,
  shortlist: readonly string[],
): ComparisonProjection | undefined {
  if (shortlist.length < 2) return undefined;
  if (shortlist.length > SHORTLIST_LIMIT) {
    throw new Error(`Comparison supports at most ${SHORTLIST_LIMIT} Tools`);
  }

  const candidates = new Map(scenario.candidates.map((candidate) => [candidate.tool.slug, candidate]));
  const selected = projectShortlist(scenario, evaluation, shortlist).items.map((item) => {
    const candidate = candidates.get(item.toolSlug)!;
    return { candidate, item };
  });

  return {
    columns: selected.map(({ candidate, item }) => ({
      candidateId: candidate.id,
      toolName: candidate.tool.name,
      toolSlug: candidate.tool.slug,
      eligibility: item.eligibility,
      eligibilityLabel: item.eligibilityLabel,
      limitation: candidate.limitation,
    })),
    rows: orderedScenarioDimensions(scenario)
      .map((dimension) => ({
        dimensionId: dimension.id,
        dimension,
        cells: selected.map(({ candidate }): ComparisonCell => {
          const claim = candidate.claims.find((candidateClaim) =>
            candidateClaim.dimensionId === dimension.id);
          return {
            toolSlug: candidate.tool.slug,
            value: claim?.evidence.value,
            evidenceState: claim?.evidence.state ?? "not_verified",
            lastCheckedAt: claim ? relevantCheckDate(claim) : undefined,
          };
        }),
      })),
  };
}
