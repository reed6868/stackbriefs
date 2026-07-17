import type { DimensionContent } from "../../content/schema";
import type { EvidenceValue } from "../../domain/evidence-types";
import type { DomainClaim } from "../../domain/model";

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
  return dimension.valueType === "boolean"
    ? ["Yes", "No"]
    : dimension.allowedValues.map((allowed) => allowed.label);
}

export function relevantCheckDate(claim: DomainClaim) {
  const selectedSourceIds = new Set(claim.evidence.sourceIds);
  return claim.sources
    .filter((source) => selectedSourceIds.has(source.id))
    .map((source) => source.lastCheckedAt)
    .sort()
    .at(-1);
}
