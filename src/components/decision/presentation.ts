import type { DimensionContent } from "../../content/schema";
import type { EvidenceState, EvidenceValue } from "../../domain/evidence-types";
import type { DomainClaim } from "../../domain/model";
import type {
  CandidateEvaluation,
  ConditionEvaluation,
  DecisionEvaluation,
} from "../../domain/decision";

export function formatDimensionValue(
  dimension: DimensionContent,
  value: EvidenceValue | undefined,
): string {
  if (value === undefined) return "No current value";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    return value.map((item) => formatDimensionValue(dimension, item)).join(", ");
  }
  if (dimension.valueType === "boolean") return String(value);
  return dimension.allowedValues.find((allowed) => allowed.value === value)?.label ?? String(value);
}

export function dimensionOptionLabels(dimension: DimensionContent) {
  return dimensionOptions(dimension).map((option) => option.label);
}

export function dimensionOptions(dimension: DimensionContent) {
  return dimension.valueType === "boolean"
    ? [{ value: "true", label: "Yes" }, { value: "false", label: "No" }]
    : dimension.allowedValues.map((allowed) => ({
        value: String(allowed.value),
        label: allowed.label,
      }));
}

export function relevantCheckDate(claim: DomainClaim) {
  const selectedSourceIds = new Set(claim.evidence.sourceIds);
  return claim.sources
    .filter((source) => selectedSourceIds.has(source.id))
    .map((source) => source.lastCheckedAt)
    .sort()
    .at(-1);
}

const evidenceStateLabels: Record<EvidenceState, string> = {
  verified_fact: "Verified fact",
  editorial_assessment: "Editorial assessment",
  not_verified: "Not verified",
  needs_recheck: "Needs recheck",
  not_applicable: "Not applicable",
  conflicting: "Conflicting",
};

export function evidenceStateLabel(state: EvidenceState) {
  return evidenceStateLabels[state];
}

export function conditionExplanationText(explanation: ConditionEvaluation) {
  if (explanation.state === "match") {
    return `${explanation.label} matches ${explanation.mode === "required" ? "required condition" : "optional preference"}`;
  }
  if (explanation.state === "no_match") {
    return `${explanation.label} does not match ${explanation.mode === "required" ? "required condition" : "optional preference"}`;
  }
  return `${explanation.label} has unknown evidence for the ${explanation.mode === "required" ? "required condition" : "optional preference"}`;
}

export function conditionReasonText(reason: ConditionEvaluation) {
  return reason.reason.replace(/^Dimension "([^"]+)" /, "$1 ");
}

export function exclusionReasons(candidate: CandidateEvaluation) {
  return candidate.required.filter((condition) => condition.state !== "match");
}

export function resultSummaryText(evaluation: DecisionEvaluation) {
  const requiredCount = evaluation.appliedConditions.filter((condition) => condition.mode === "required").length;
  const optionalCount = evaluation.appliedConditions.length - requiredCount;
  return {
    heading: evaluation.appliedConditions.length === 0
      ? `${evaluation.matches.length} ${evaluation.matches.length === 1 ? "tool" : "tools"} in this Scenario`
      : evaluation.matches.length === 0
        ? "No tools match every required condition"
        : `${evaluation.matches.length} ${evaluation.matches.length === 1 ? "tool matches" : "tools match"}`,
    description: evaluation.appliedConditions.length === 0
      ? "No requirements are applied yet. Review each Tool's evidence and limitation."
      : `${requiredCount} required ${requiredCount === 1 ? "condition" : "conditions"} and ${optionalCount} optional ${optionalCount === 1 ? "preference" : "preferences"} applied.`,
  };
}
