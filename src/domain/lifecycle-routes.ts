import type { DomainScenario, PublicationAssembly } from "./model";
import { projectToolDetail, type ToolDetailProjection } from "./tool-detail";

export interface LifecycleStatusRoute {
  kind: "status";
  status: "blocked" | "retired";
  noindex: true;
  documentTitle: string;
  description: string;
  heading: string;
  message: string;
  breadcrumbLabel: string;
}

export interface PublishedScenarioRoute {
  kind: "published";
  scenario: DomainScenario;
  indexable: boolean;
  structuredData: boolean;
}

export interface PublishedToolRoute {
  kind: "published";
  detail: ToolDetailProjection;
  indexable: boolean;
  structuredData: boolean;
}

export type ScenarioRoute = PublishedScenarioRoute | LifecycleStatusRoute;
export type ToolRoute = PublishedToolRoute | LifecycleStatusRoute;

export interface ScenarioRoutePath {
  params: { scenario: string };
  props: { route: ScenarioRoute };
}

export interface ToolRoutePath {
  params: { slug: string };
  props: { route: ToolRoute };
}

export interface LifecycleRedirect {
  from: string;
  to: string;
  statusCode: 301;
}

function statusRoute(
  status: LifecycleStatusRoute["status"],
  label: string,
  contentType: "Scenario" | "Tool page",
): LifecycleStatusRoute {
  if (status === "retired") {
    return {
      kind: "status",
      status,
      noindex: true,
      documentTitle: `${label} retired | StackBriefs`,
      description: `The ${contentType} is no longer maintained on StackBriefs.`,
      heading: `${label} has retired`,
      message: `This ${contentType} is no longer maintained. Use a recovery path below to continue with current content.`,
      breadcrumbLabel: label,
    };
  }

  return {
    kind: "status",
    status,
    noindex: true,
    documentTitle: `${label} temporarily unavailable | StackBriefs`,
    description: `The ${contentType} is temporarily unavailable on StackBriefs.`,
    heading: `${label} is temporarily unavailable`,
    message: `This ${contentType} is withheld while its publication requirements are reviewed. Previous decision controls and current claims are not shown here.`,
    breadcrumbLabel: label,
  };
}

export function projectScenarioRoutePaths(assembly: PublicationAssembly) {
  const publishedSlugs = new Set(assembly.publicInputs.decisionRouteSlugs);
  const statusSlugs = new Set(assembly.publicInputs.statusScenarioSlugs);
  const structuredDataPaths = new Set(assembly.publicInputs.structuredDataPaths);

  return assembly.scenarioOutcomes.flatMap((outcome): ScenarioRoutePath[] => {
    if (outcome.kind === "published" && publishedSlugs.has(outcome.slug)) {
      return [{
        params: { scenario: outcome.slug },
        props: {
          route: {
            kind: "published",
            scenario: outcome.scenario,
            indexable: assembly.publicInputs.indexable,
            structuredData: structuredDataPaths.has(`/decision/${outcome.slug}`),
          } satisfies PublishedScenarioRoute,
        },
      }];
    }
    if ((outcome.kind === "blocked" || outcome.kind === "retired") && statusSlugs.has(outcome.slug)) {
      return [{
        params: { scenario: outcome.slug },
        props: { route: statusRoute(outcome.kind, outcome.title, "Scenario") },
      }];
    }
    return [];
  });
}

export function projectToolRoutePaths(assembly: PublicationAssembly) {
  const exposedSlugs = new Set(assembly.publicInputs.exposedToolSlugs);
  const statusSlugs = new Set(assembly.publicInputs.statusToolSlugs);
  const structuredDataPaths = new Set(assembly.publicInputs.structuredDataPaths);

  return assembly.toolOutcomes.flatMap((outcome): ToolRoutePath[] => {
    if (outcome.kind === "exposed-tool" && exposedSlugs.has(outcome.slug)) {
      const detail = projectToolDetail(assembly, outcome.slug);
      return detail ? [{
        params: { slug: outcome.slug },
        props: {
          route: {
            kind: "published",
            detail,
            indexable: assembly.publicInputs.indexable,
            structuredData: structuredDataPaths.has(`/tool/${outcome.slug}`),
          } satisfies PublishedToolRoute,
        },
      }] : [];
    }
    if ((outcome.kind === "blocked" || outcome.kind === "retired") && statusSlugs.has(outcome.slug)) {
      return [{
        params: { slug: outcome.slug },
        props: { route: statusRoute(outcome.kind, outcome.name, "Tool page") },
      }];
    }
    return [];
  });
}

export function projectLifecycleRedirects(assembly: PublicationAssembly): LifecycleRedirect[] {
  return [
    ...assembly.publicInputs.scenarioRedirects,
    ...assembly.publicInputs.toolRedirects,
  ].sort((left, right) => left.from.localeCompare(right.from, "en"));
}
