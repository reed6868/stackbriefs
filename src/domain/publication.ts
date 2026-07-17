import type { ContentGraph } from "../content/schema";
import type { PublicationAssembly, PublicationOptions } from "./model";
import { assembleOffers } from "./offer-publication";
import { assemblePublicInputs } from "./public-inputs";
import { publicationIssue, sortPublicationIssues } from "./publication-helpers";
import { assembleScenarioOutcomes } from "./scenario-publication";
import { assembleToolOutcomes } from "./tool-publication";

export type { PublicationAssembly, PublicationOptions } from "./model";

export function assemblePublication(graph: ContentGraph, options: PublicationOptions): PublicationAssembly {
  const scenarioOutcomes = assembleScenarioOutcomes(graph, options);
  const scenarioIssues = scenarioOutcomes.flatMap((outcome) => (outcome.kind === "blocked" ? outcome.issues : []));
  const toolOutcomes = assembleToolOutcomes(graph, scenarioOutcomes, options.target);
  const toolIssues = toolOutcomes.flatMap((outcome) => (outcome.kind === "blocked" ? outcome.issues : []));
  const exposedToolIds = new Set(
    toolOutcomes.filter((outcome) => outcome.kind === "exposed-tool").map((outcome) => outcome.id),
  );
  const offerAssembly = assembleOffers(graph, exposedToolIds, options.target);
  const issues = [...scenarioIssues, ...toolIssues];
  const publishedRealScenarioCount = scenarioOutcomes.filter(
    (outcome) => outcome.kind === "published" && !outcome.fixture,
  ).length;

  if (options.target === "production" && publishedRealScenarioCount === 0) {
    issues.push(
      publicationIssue(
        "production_requires_published_scenario",
        "publication.production",
        "Production requires at least one published non-fixture Scenario",
      ),
    );
  }

  return {
    target: options.target,
    asOf: options.asOf,
    scenarioOutcomes,
    toolOutcomes,
    offers: offerAssembly.offers,
    issues: sortPublicationIssues(issues),
    offerIssues: offerAssembly.issues,
    publicInputs: assemblePublicInputs(scenarioOutcomes, toolOutcomes, options.target),
    releaseReady: issues.length === 0,
  };
}
