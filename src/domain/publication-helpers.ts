import type { ScenarioContent, ToolContent } from "../content/schema";
import type { BuildTarget, PublicationIssue } from "./model";

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
