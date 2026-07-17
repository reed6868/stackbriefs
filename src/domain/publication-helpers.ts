import type { ScenarioContent, SourceContent, ToolContent } from "../content/schema";
import type { BuildTarget, PublicationIssue } from "./model";

const MAX_GATING_AGE_DAYS = 90;
const DAY_MS = 86_400_000;

function isoDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

export function publicationIssue(code: string, path: string, message: string): PublicationIssue {
  return { code, path, message };
}

export function sortPublicationIssues(issues: readonly PublicationIssue[]) {
  return [...issues].sort(
    (left, right) => left.path.localeCompare(right.path, "en") || left.code.localeCompare(right.code, "en"),
  );
}

export function fixtureExcluded(fixture: boolean, target: BuildTarget) {
  return fixture && target === "production";
}

export function sourceIsCurrent(source: SourceContent, asOf: string) {
  const ageDays = (isoDay(asOf) - isoDay(source.lastCheckedAt)) / DAY_MS;
  if (ageDays < 0 || ageDays > MAX_GATING_AGE_DAYS) return false;
  if (source.effectiveFrom && source.effectiveFrom > asOf) return false;
  if (source.effectiveTo && source.effectiveTo < asOf) return false;
  return true;
}

export function validateReplacement(
  routeType: "scenario" | "tool",
  record: ScenarioContent | ToolContent,
  replacement: ScenarioContent | ToolContent | undefined,
  target: BuildTarget,
) {
  if (
    !replacement ||
    replacement.status !== "published" ||
    replacement.fixture !== record.fixture ||
    replacement.id === record.id ||
    fixtureExcluded(replacement.fixture, target)
  ) {
    return publicationIssue(
      "invalid_replacement",
      `${routeType}s[${record.id}].replacementSlug`,
      `replacement "${record.replacementSlug}" must resolve to a different published ${routeType} with matching fixture provenance`,
    );
  }
  return undefined;
}
