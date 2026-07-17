import type {
  BuildTarget,
  PublicContentInputs,
  ScenarioPublicationOutcome,
  ToolPublicationOutcome,
} from "./model";

export function assemblePublicInputs(
  scenarioOutcomes: readonly ScenarioPublicationOutcome[],
  toolOutcomes: readonly ToolPublicationOutcome[],
  target: BuildTarget,
): PublicContentInputs {
  const publishedScenarios = scenarioOutcomes.filter((outcome) => outcome.kind === "published");
  const statusScenarios = scenarioOutcomes.filter(
    (outcome) =>
      outcome.kind === "retired" ||
      (outcome.kind === "blocked" && (outcome.fixture || outcome.firstPublishedAt !== undefined)),
  );
  const redirects = scenarioOutcomes.filter((outcome) => outcome.kind === "replacement");
  const exposedTools = toolOutcomes.filter((outcome) => outcome.kind === "exposed-tool");
  const statusTools = toolOutcomes.filter(
    (outcome) =>
      outcome.kind === "retired" ||
      (outcome.kind === "blocked" && (outcome.fixture || outcome.firstPublishedAt !== undefined)),
  );
  const toolRedirects = toolOutcomes.filter((outcome) => outcome.kind === "replacement");
  const decisionPaths = publishedScenarios.map((outcome) => `/decision/${outcome.slug}`);
  const toolPaths = exposedTools.map((outcome) => `/tool/${outcome.slug}`);

  return {
    discoveryScenarioSlugs: publishedScenarios.map((outcome) => outcome.slug),
    decisionRouteSlugs: publishedScenarios.map((outcome) => outcome.slug),
    statusScenarioSlugs: statusScenarios.map((outcome) => outcome.slug),
    scenarioRedirects: redirects.map((outcome) => ({
      from: `/decision/${outcome.slug}`,
      to: outcome.redirectTo.href,
      statusCode: 301,
    })),
    exposedToolSlugs: exposedTools.map((outcome) => outcome.slug),
    statusToolSlugs: statusTools.map((outcome) => outcome.slug),
    toolRedirects: toolRedirects.map((outcome) => ({
      from: `/tool/${outcome.slug}`,
      to: outcome.redirectTo.href,
      statusCode: 301,
    })),
    sitemapPaths: [...decisionPaths, ...toolPaths].sort((left, right) => left.localeCompare(right, "en")),
    structuredDataPaths: [...decisionPaths, ...toolPaths].sort((left, right) => left.localeCompare(right, "en")),
    indexable: target === "production",
  };
}
