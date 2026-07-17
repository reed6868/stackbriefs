import type { DimensionContent } from "../content/schema";
import {
  isValidDecisionConditionValue,
  type DecisionCondition,
  type DecisionConditionValue,
} from "./decision";
import { SHORTLIST_LIMIT } from "./shortlist";

export interface UrlStateScenario {
  slug: string;
  dimensions: readonly DimensionContent[];
  candidates: ReadonlyArray<{ tool: { slug: string } }>;
}

export interface UrlState {
  conditions: readonly DecisionCondition[];
  shortlist: readonly string[];
  comparison: boolean;
}

export type UrlStateInput = UrlState;

export interface UrlLocationInput {
  search: string;
  hash: string;
}

export interface SerializedUrlState {
  search: string;
  hash: string;
}

export function parseDecisionConditionValue(
  dimension: DimensionContent,
  value: string,
): DecisionConditionValue | undefined {
  if (dimension.valueType === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  }
  if (dimension.valueType === "number") {
    return dimension.allowedValues.find((allowed) => String(allowed.value) === value)?.value;
  }
  return isValidDecisionConditionValue(dimension, value) ? value : undefined;
}

function normalizeConditions(scenario: UrlStateScenario, conditions: readonly DecisionCondition[]) {
  const dimensions = new Map(scenario.dimensions.map((dimension) => [dimension.id, dimension]));
  const seen = new Set<string>();
  const normalized = conditions.flatMap((condition): DecisionCondition[] => {
    if (condition.mode !== "required" && condition.mode !== "optional") return [];
    const dimension = dimensions.get(condition.dimensionId);
    if (!dimension || seen.has(condition.dimensionId) || !isValidDecisionConditionValue(dimension, condition.value)) {
      return [];
    }
    seen.add(condition.dimensionId);
    return [{ ...condition }];
  });
  return normalized.sort((left, right) =>
    dimensions.get(left.dimensionId)!.order - dimensions.get(right.dimensionId)!.order);
}

function normalizeShortlist(scenario: UrlStateScenario, shortlist: readonly string[]) {
  const validSlugs = new Set(scenario.candidates.map((candidate) => candidate.tool.slug));
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const slug of shortlist) {
    if (!validSlugs.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    normalized.push(slug);
    if (normalized.length === SHORTLIST_LIMIT) break;
  }
  return normalized;
}

export function normalizeUrlState(scenario: UrlStateScenario, input: UrlStateInput): UrlState {
  const conditions = normalizeConditions(scenario, input.conditions);
  const shortlist = normalizeShortlist(scenario, input.shortlist);
  return {
    conditions,
    shortlist,
    comparison: input.comparison === true && shortlist.length >= 2,
  };
}

export function parseUrlState(scenario: UrlStateScenario, location: UrlLocationInput): UrlState {
  const dimensions = new Map(scenario.dimensions.map((dimension) => [dimension.id, dimension]));
  const conditions: DecisionCondition[] = [];
  const shortlist: string[] = [];
  const params = new URLSearchParams(location.search.startsWith("?") ? location.search.slice(1) : location.search);

  for (const [key, rawValue] of params) {
    if (key === "shortlist") {
      shortlist.push(...rawValue.split(","));
      continue;
    }
    if (key !== "r" && key !== "p") continue;
    const separator = rawValue.indexOf(":");
    if (separator <= 0) continue;
    const dimensionId = rawValue.slice(0, separator);
    const dimension = dimensions.get(dimensionId);
    if (!dimension) continue;
    const value = parseDecisionConditionValue(dimension, rawValue.slice(separator + 1));
    if (value === undefined) continue;
    conditions.push({ dimensionId, value, mode: key === "r" ? "required" : "optional" });
  }

  return normalizeUrlState(scenario, {
    conditions,
    shortlist,
    comparison: location.hash === "#comparison",
  });
}

function serializeValue(value: DecisionConditionValue) {
  return typeof value === "boolean" ? String(value) : encodeURIComponent(String(value));
}

export function serializeUrlState(scenario: UrlStateScenario, input: UrlStateInput): SerializedUrlState {
  const normalized = normalizeUrlState(scenario, input);
  const required = normalized.conditions.filter((condition) => condition.mode === "required");
  const optional = normalized.conditions.filter((condition) => condition.mode === "optional");
  const query = [
    ...required.map((condition) => `r=${encodeURIComponent(condition.dimensionId)}:${serializeValue(condition.value)}`),
    ...optional.map((condition) => `p=${encodeURIComponent(condition.dimensionId)}:${serializeValue(condition.value)}`),
    ...(normalized.shortlist.length > 0
      ? [`shortlist=${normalized.shortlist.map((slug) => encodeURIComponent(slug)).join(",")}`]
      : []),
  ];
  return {
    search: query.length > 0 ? `?${query.join("&")}` : "",
    hash: normalized.comparison ? "#comparison" : "",
  };
}

export function decisionCanonicalPath(scenario: UrlStateScenario) {
  return `/decision/${scenario.slug}`;
}
