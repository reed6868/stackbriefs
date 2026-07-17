import type { ContentGraph } from "../content/schema";
import type { PublicationAssembly, PublicationOptions } from "./model";
import { assembleOffers } from "./offer-publication";
import { assemblePublicInputs } from "./public-inputs";
import { publicationIssue, sortPublicationIssues } from "./publication-helpers";
import { collectReferenceDiagnostics } from "./reference-diagnostics";
import { assembleScenarioOutcomes } from "./scenario-publication";
import { assembleToolOutcomes } from "./tool-publication";

export type { PublicationAssembly, PublicationOptions } from "./model";

export function assemblePublication(graph: ContentGraph, options: PublicationOptions): PublicationAssembly {
  const diagnostics = collectReferenceDiagnostics(graph, options.publicationHistory ?? []);
  const scenarioOutcomes = assembleScenarioOutcomes(
    graph,
    options,
    diagnostics.scenarioIssues,
    diagnostics.invalidScenarioIds,
  );
  const scenarioIssues = scenarioOutcomes.flatMap((outcome) => (outcome.kind === "blocked" ? outcome.issues : []));
  const toolOutcomes = assembleToolOutcomes(
    graph,
    scenarioOutcomes,
    options.target,
    diagnostics.toolIssues,
    diagnostics.invalidToolIds,
  );
  const toolIssues = toolOutcomes.flatMap((outcome) => (outcome.kind === "blocked" ? outcome.issues : []));
  const exposedToolIds = new Set(
    toolOutcomes.filter((outcome) => outcome.kind === "exposed-tool").map((outcome) => outcome.id),
  );
  const offerAssembly = assembleOffers(graph, exposedToolIds, options.target, diagnostics.offerIssues);
  const releaseBlockingIssues = [...diagnostics.globalIssues];
  const issues = [...scenarioIssues, ...toolIssues, ...releaseBlockingIssues];
  const publishedRealScenarioCount = scenarioOutcomes.filter(
    (outcome) => outcome.kind === "published" && !outcome.fixture,
  ).length;

  if (options.target === "production" && publishedRealScenarioCount === 0) {
    const productionIssue = publicationIssue(
      "production_requires_published_scenario",
      "publication.production",
      "Production requires at least one published non-fixture Scenario",
    );
    issues.push(productionIssue);
    releaseBlockingIssues.push(productionIssue);
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
    releaseReady: releaseBlockingIssues.length === 0,
  };
}
