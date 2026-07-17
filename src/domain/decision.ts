import type { DimensionContent } from "../content/schema";
import type { EvidenceState, EvidenceValue } from "./evidence-types";
import type { DomainCandidate, DomainClaim, DomainScenario } from "./model";

export type DecisionConditionMode = "required" | "optional";
export type DecisionConditionValue = boolean | string | number;
export type ConditionEvaluationState = "match" | "no_match" | "unknown";

export interface DecisionCondition {
  dimensionId: string;
  mode: DecisionConditionMode;
  value: DecisionConditionValue;
}

export interface ConditionEvaluation {
  dimensionId: string;
  label: string;
  mode: DecisionConditionMode;
  operator: DimensionContent["operator"];
  selectedValue: DecisionConditionValue;
  actualValue?: EvidenceValue | undefined;
  evidenceState: EvidenceState;
  state: ConditionEvaluationState;
  reason: string;
}

export type DecisionExplanation =
  | ({ kind: "condition" } & ConditionEvaluation)
  | { kind: "limitation"; text: string };

export interface CandidateEvaluation {
  candidateId: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  state: ConditionEvaluationState;
  required: readonly ConditionEvaluation[];
  optional: readonly ConditionEvaluation[];
  explanations: readonly DecisionExplanation[];
  limitation: string;
}

export interface RelaxationOption {
  dimensionId: string;
  label: string;
  currentValue: DecisionConditionValue;
  candidateIds: readonly string[];
}

export interface DecisionEvaluation {
  scenarioId: string;
  appliedConditions: readonly DecisionCondition[];
  matches: readonly CandidateEvaluation[];
  exclusions: readonly CandidateEvaluation[];
  relaxations: readonly RelaxationOption[];
}

function normalizedText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ");
}

function compareCandidates(left: DomainCandidate, right: DomainCandidate) {
  const byName = normalizedText(left.tool.name).localeCompare(normalizedText(right.tool.name), "en");
  if (byName !== 0) return byName;
  const bySlug = left.tool.slug.localeCompare(right.tool.slug, "en");
  return bySlug !== 0 ? bySlug : left.id.localeCompare(right.id, "en");
}

function allowedValues(dimension: DimensionContent) {
  return dimension.valueType === "boolean"
    ? [true, false]
    : dimension.allowedValues.map(({ value }) => value);
}

export function isValidDecisionConditionValue(
  dimension: DimensionContent,
  value: DecisionConditionValue,
) {
  const validType = dimension.valueType === "boolean"
    ? typeof value === "boolean"
    : dimension.valueType === "number"
      ? typeof value === "number" && Number.isFinite(value)
      : typeof value === "string";
  return validType && allowedValues(dimension).includes(value as never);
}

function validateCondition(dimension: DimensionContent, condition: DecisionCondition) {
  if (!isValidDecisionConditionValue(dimension, condition.value)) {
    throw new Error(`Decision condition has invalid value for Dimension "${dimension.id}"`);
  }
}

function normalizeConditions(scenario: DomainScenario, conditions: readonly DecisionCondition[]) {
  const dimensions = new Map(scenario.dimensions.map((dimension) => [dimension.id, dimension]));
  const seen = new Set<string>();
  conditions.forEach((condition) => {
    if (condition.mode !== "required" && condition.mode !== "optional") {
      throw new Error(`Decision condition has invalid mode for Dimension "${condition.dimensionId}"`);
    }
    const dimension = dimensions.get(condition.dimensionId);
    if (!dimension) throw new Error(`Decision condition references unknown Dimension "${condition.dimensionId}"`);
    if (seen.has(condition.dimensionId)) {
      throw new Error(`Decision input supports one active condition per Dimension "${condition.dimensionId}"`);
    }
    seen.add(condition.dimensionId);
    validateCondition(dimension, condition);
  });
  return [...conditions].sort((left, right) =>
    dimensions.get(left.dimensionId)!.order - dimensions.get(right.dimensionId)!.order);
}

function operatorMatches(
  dimension: DimensionContent,
  actual: EvidenceValue,
  selected: DecisionConditionValue,
): boolean | undefined {
  if (dimension.operator === "eq") {
    if (Array.isArray(actual) || typeof actual !== typeof selected) return undefined;
    return actual === selected;
  }
  if (dimension.operator === "contains") {
    return Array.isArray(actual) && typeof selected === "string" ? actual.includes(selected) : undefined;
  }
  if (typeof actual !== "number" || typeof selected !== "number") return undefined;
  return dimension.operator === "lte" ? actual <= selected : actual >= selected;
}

function evaluateCondition(
  dimension: DimensionContent,
  claim: DomainClaim | undefined,
  condition: DecisionCondition,
): ConditionEvaluation {
  const base = {
    dimensionId: dimension.id,
    label: dimension.label,
    mode: condition.mode,
    operator: dimension.operator,
    selectedValue: condition.value,
  } as const;
  if (!claim) {
    return {
      ...base,
      evidenceState: "not_verified",
      state: "unknown",
      reason: `Dimension "${dimension.label}" has no Candidate claim`,
    };
  }
  if (claim.evidence.state === "not_applicable") {
    return {
      ...base,
      evidenceState: claim.evidence.state,
      state: "no_match",
      reason: `Dimension "${dimension.label}" is explicitly not applicable`,
    };
  }
  if (claim.evidence.state !== "verified_fact" || claim.evidence.value === undefined) {
    return {
      ...base,
      evidenceState: claim.evidence.state,
      state: "unknown",
      reason: `Dimension "${dimension.label}" cannot be evaluated from ${claim.evidence.state} evidence`,
    };
  }
  const matches = operatorMatches(dimension, claim.evidence.value, condition.value);
  if (matches === undefined) {
    return {
      ...base,
      actualValue: claim.evidence.value,
      evidenceState: claim.evidence.state,
      state: "unknown",
      reason: `Dimension "${dimension.label}" has an incompatible canonical value`,
    };
  }
  return {
    ...base,
    actualValue: claim.evidence.value,
    evidenceState: claim.evidence.state,
    state: matches ? "match" : "no_match",
    reason: matches
      ? `Dimension "${dimension.label}" matches the selected value`
      : `Dimension "${dimension.label}" does not match the selected value`,
  };
}

function evaluateCandidate(
  scenario: DomainScenario,
  candidate: DomainCandidate,
  conditions: readonly DecisionCondition[],
): CandidateEvaluation {
  const dimensions = new Map(scenario.dimensions.map((dimension) => [dimension.id, dimension]));
  const claims = new Map(candidate.claims.map((claim) => [claim.dimensionId, claim]));
  const evaluations = conditions.map((condition) =>
    evaluateCondition(dimensions.get(condition.dimensionId)!, claims.get(condition.dimensionId), condition));
  const required = evaluations.filter((evaluation) => evaluation.mode === "required");
  const optional = evaluations.filter((evaluation) => evaluation.mode === "optional");
  const state = required.some((evaluation) => evaluation.state === "no_match")
    ? "no_match"
    : required.some((evaluation) => evaluation.state === "unknown")
      ? "unknown"
      : "match";

  return {
    candidateId: candidate.id,
    toolId: candidate.tool.id,
    toolName: candidate.tool.name,
    toolSlug: candidate.tool.slug,
    state,
    required,
    optional,
    explanations: [
      ...evaluations.map((evaluation) => ({ kind: "condition" as const, ...evaluation })),
      { kind: "limitation", text: candidate.limitation },
    ],
    limitation: candidate.limitation,
  };
}

function deriveRelaxations(
  scenario: DomainScenario,
  conditions: readonly DecisionCondition[],
  candidates: readonly CandidateEvaluation[],
) {
  const dimensions = new Map(scenario.dimensions.map((dimension) => [dimension.id, dimension]));
  const required = conditions.filter((condition) => condition.mode === "required");
  return required.flatMap((condition): RelaxationOption[] => {
    const candidateIds = candidates
      .filter((candidate) =>
        candidate.required.every((evaluation) =>
          evaluation.dimensionId === condition.dimensionId || evaluation.state === "match"))
      .map((candidate) => candidate.candidateId);
    return candidateIds.length === 0
      ? []
      : [{
          dimensionId: condition.dimensionId,
          label: dimensions.get(condition.dimensionId)!.label,
          currentValue: condition.value,
          candidateIds,
        }];
  });
}

export function evaluateDecision(
  scenario: DomainScenario,
  conditions: readonly DecisionCondition[],
): DecisionEvaluation {
  const appliedConditions = normalizeConditions(scenario, conditions);
  const candidates = [...scenario.candidates]
    .sort(compareCandidates)
    .map((candidate) => evaluateCandidate(scenario, candidate, appliedConditions));
  const matches = candidates.filter((candidate) => candidate.state === "match");
  const exclusions = candidates.filter((candidate) => candidate.state !== "match");

  return {
    scenarioId: scenario.id,
    appliedConditions,
    matches,
    exclusions,
    relaxations: matches.length === 0 ? deriveRelaxations(scenario, appliedConditions, candidates) : [],
  };
}
