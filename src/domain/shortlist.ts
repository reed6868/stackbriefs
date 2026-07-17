import type { ConditionEvaluationState, DecisionEvaluation } from "./decision";
import type { DomainScenario } from "./model";

export const SHORTLIST_LIMIT = 4;
export const SHORTLIST_LIMIT_REASON = "Shortlist is full. Remove a Tool before adding another.";
export const COMPARE_DISABLED_REASON = "Choose at least two Tools to compare.";

export type ShortlistAddResult =
  | { kind: "added"; shortlist: readonly string[] }
  | { kind: "unchanged"; shortlist: readonly string[] }
  | { kind: "rejected"; shortlist: readonly string[]; reason: string };

export interface ShortlistItemProjection {
  candidateId: string;
  toolSlug: string;
  eligibility: ConditionEvaluationState;
  eligibilityLabel: string;
}

export interface ShortlistProjection {
  items: readonly ShortlistItemProjection[];
  countLabel: string;
  canCompare: boolean;
  compareReason?: string | undefined;
  atLimit: boolean;
  limitReason?: string | undefined;
}

export function addShortlistItem(
  shortlist: readonly string[],
  toolSlug: string,
): ShortlistAddResult {
  if (shortlist.includes(toolSlug)) return { kind: "unchanged", shortlist: [...shortlist] };
  if (shortlist.length >= SHORTLIST_LIMIT) {
    return { kind: "rejected", shortlist: [...shortlist], reason: SHORTLIST_LIMIT_REASON };
  }
  return { kind: "added", shortlist: [...shortlist, toolSlug] };
}

export function removeShortlistItem(shortlist: readonly string[], toolSlug: string) {
  return shortlist.filter((candidateSlug) => candidateSlug !== toolSlug);
}

function eligibilityLabel(state: ConditionEvaluationState) {
  if (state === "match") return "Matches current filters";
  if (state === "unknown") return "Current eligibility has unknown evidence";
  return "No longer matches required conditions";
}

export function projectShortlist(
  scenario: DomainScenario,
  evaluation: DecisionEvaluation,
  shortlist: readonly string[],
): ShortlistProjection {
  const candidates = new Map(scenario.candidates.map((candidate) => [candidate.tool.slug, candidate]));
  const evaluations = new Map(
    [...evaluation.matches, ...evaluation.exclusions]
      .map((candidate) => [candidate.candidateId, candidate] as const),
  );
  const items = shortlist.map((toolSlug): ShortlistItemProjection => {
    const candidate = candidates.get(toolSlug);
    if (!candidate) throw new Error(`Shortlist references unknown Tool "${toolSlug}"`);
    const candidateEvaluation = evaluations.get(candidate.id);
    if (!candidateEvaluation) throw new Error(`Shortlist requires evaluation for Candidate "${candidate.id}"`);
    return {
      candidateId: candidate.id,
      toolSlug,
      eligibility: candidateEvaluation.state,
      eligibilityLabel: eligibilityLabel(candidateEvaluation.state),
    };
  });
  const canCompare = items.length >= 2;
  const atLimit = items.length >= SHORTLIST_LIMIT;
  return {
    items,
    countLabel: `${items.length} ${items.length === 1 ? "tool" : "tools"} shortlisted`,
    canCompare,
    compareReason: canCompare ? undefined : COMPARE_DISABLED_REASON,
    atLimit,
    limitReason: atLimit ? SHORTLIST_LIMIT_REASON : undefined,
  };
}
