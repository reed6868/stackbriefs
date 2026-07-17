import type { ContentGraph } from "../content/schema";
import type { BuildTarget, DomainOffer, PublicationIssue } from "./model";
import { fixtureExcluded, publicationIssue, sortPublicationIssues } from "./publication-helpers";

export function assembleOffers(graph: ContentGraph, exposedToolIds: ReadonlySet<string>, target: BuildTarget) {
  const toolsById = new Map(graph.tools.map((tool) => [tool.id, tool]));
  const sourcesById = new Map(graph.sources.map((source) => [source.id, source]));
  const offers: DomainOffer[] = [];
  const issues: PublicationIssue[] = [];

  [...graph.offers]
    .sort((left, right) => left.id.localeCompare(right.id, "en"))
    .forEach((offer) => {
      if (fixtureExcluded(offer.fixture, target)) return;
      const path = `offers[${offer.id}]`;
      const tool = toolsById.get(offer.toolId);
      if (!tool) {
        issues.push(
          publicationIssue("offer_missing_tool", `${path}.toolId`, `referenced Tool "${offer.toolId}" does not exist`),
        );
        return;
      }
      if (tool.fixture !== offer.fixture) {
        issues.push(
          publicationIssue("offer_fixture_mismatch", `${path}.toolId`, "Offer and Tool must have matching fixture provenance"),
        );
        return;
      }
      const evidence = offer.evidenceIds.flatMap((sourceId) => {
        const source = sourcesById.get(sourceId);
        if (!source || source.subjectType !== "offer" || source.subjectId !== offer.id || source.fixture !== offer.fixture) {
          issues.push(
            publicationIssue("offer_missing_evidence", `${path}.evidenceIds`, `Source "${sourceId}" does not resolve to this Offer`),
          );
          return [];
        }
        return [source];
      });
      if (issues.some((offerIssue) => offerIssue.path.startsWith(path))) return;
      if (!exposedToolIds.has(tool.id)) return;
      offers.push({ ...offer, tool, evidence });
    });

  return { offers, issues: sortPublicationIssues(issues) };
}
