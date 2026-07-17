import type { ContentGraph, GraphIssue, PublicationHistory } from "../content/schema";
import { validatePublicationHistory, validateReferences } from "../content/schema";
import type { PublicationIssue } from "./model";
import { publicationIssue } from "./publication-helpers";

export interface ReferenceDiagnostics {
  scenarioIssues: ReadonlyMap<string, readonly PublicationIssue[]>;
  toolIssues: ReadonlyMap<string, readonly PublicationIssue[]>;
  offerIssues: ReadonlyMap<string, readonly PublicationIssue[]>;
  globalIssues: readonly PublicationIssue[];
}

function append(map: Map<string, PublicationIssue[]>, id: string, value: PublicationIssue) {
  map.set(id, [...(map.get(id) ?? []), value]);
}

function formatPath(graph: ContentGraph, validationIssue: GraphIssue) {
  const [collection, index, ...rest] = validationIssue.path;
  if (typeof collection === "string" && collection in graph && typeof index === "number") {
    const records = graph[collection as keyof ContentGraph];
    const record = records[index] as { id?: string } | undefined;
    return `${collection}[${record?.id ?? index}]${rest.length ? `.${rest.join(".")}` : ""}`;
  }
  return validationIssue.path.join(".");
}

export function collectReferenceDiagnostics(graph: ContentGraph, publicationHistory: PublicationHistory = []) {
  const scenarioIssues = new Map<string, PublicationIssue[]>();
  const toolIssues = new Map<string, PublicationIssue[]>();
  const offerIssues = new Map<string, PublicationIssue[]>();
  const globalIssues: PublicationIssue[] = [];
  const candidates = new Map(graph.candidates.map((candidate) => [candidate.id, candidate]));
  const validationIssues = [
    ...validateReferences(graph),
    ...validatePublicationHistory(graph, publicationHistory),
  ];

  validationIssues.forEach((validationIssue) => {
    const [collection, index] = validationIssue.path;
    const diagnostic = publicationIssue(
      "invalid_content_reference",
      formatPath(graph, validationIssue),
      validationIssue.message,
    );

    if (collection === "scenarios" && typeof index === "number") {
      const scenario = graph.scenarios[index];
      if (scenario) append(scenarioIssues, scenario.id, diagnostic);
      else globalIssues.push(diagnostic);
      return;
    }
    if (collection === "candidates" && typeof index === "number") {
      const candidate = graph.candidates[index];
      if (candidate) append(scenarioIssues, candidate.scenarioId, diagnostic);
      else globalIssues.push(diagnostic);
      return;
    }
    if (collection === "tools" && typeof index === "number") {
      const tool = graph.tools[index];
      if (!tool) {
        globalIssues.push(diagnostic);
        return;
      }
      append(toolIssues, tool.id, diagnostic);
      graph.candidates
        .filter((candidate) => candidate.toolId === tool.id)
        .forEach((candidate) => append(scenarioIssues, candidate.scenarioId, diagnostic));
      return;
    }
    if (collection === "sources" && typeof index === "number") {
      const source = graph.sources[index];
      if (!source) {
        globalIssues.push(diagnostic);
      } else if (source.subjectType === "candidate") {
        const candidate = candidates.get(source.subjectId);
        candidate ? append(scenarioIssues, candidate.scenarioId, diagnostic) : globalIssues.push(diagnostic);
      } else if (source.subjectType === "tool") {
        const matchingCandidates = graph.candidates.filter((candidate) => candidate.toolId === source.subjectId);
        matchingCandidates.length > 0
          ? matchingCandidates.forEach((candidate) => append(scenarioIssues, candidate.scenarioId, diagnostic))
          : globalIssues.push(diagnostic);
      } else {
        append(offerIssues, source.subjectId, diagnostic);
      }
      return;
    }
    if (collection === "offers" && typeof index === "number") {
      const offer = graph.offers[index];
      offer ? append(offerIssues, offer.id, diagnostic) : globalIssues.push(diagnostic);
      return;
    }
    if (collection === "publicationHistory" && typeof index === "number") {
      const entry = publicationHistory[index];
      if (!entry) {
        globalIssues.push(diagnostic);
      } else if (entry.recordType === "scenario") {
        append(scenarioIssues, entry.id, diagnostic);
      } else {
        append(toolIssues, entry.id, diagnostic);
      }
      return;
    }
    globalIssues.push(diagnostic);
  });

  return { scenarioIssues, toolIssues, offerIssues, globalIssues } satisfies ReferenceDiagnostics;
}
