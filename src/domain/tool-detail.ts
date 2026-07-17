import type { ToolContent } from "../content/schema";
import type { PublicationAssembly } from "./model";
import {
  decisionCanonicalPath,
  parseUrlState,
  serializeUrlState,
  type UrlStateScenario,
} from "./url-state";

export interface ToolContextReference {
  scenarioSlug: string;
  scenarioTitle: string;
  urlStateScenario: UrlStateScenario;
}

export interface ToolScenarioContext extends ToolContextReference {
  scenarioId: string;
  scenarioGoal: string;
  limitation: string;
  handsOnState: "tested" | "partially_tested" | "not_tested" | "unavailable";
  verificationChecklist: readonly string[];
}

export interface ToolDetailProjection {
  tool: ToolContent;
  contexts: readonly ToolScenarioContext[];
}

export function projectToolDetail(
  assembly: PublicationAssembly,
  toolSlug: string,
): ToolDetailProjection | undefined {
  const toolOutcome = assembly.toolOutcomes.find((outcome) =>
    outcome.kind === "exposed-tool" && outcome.slug === toolSlug);
  if (!toolOutcome || toolOutcome.kind !== "exposed-tool") return undefined;

  const relatedScenarioIds = new Set(toolOutcome.scenarioIds);
  const contexts = assembly.scenarioOutcomes.flatMap((outcome): ToolScenarioContext[] => {
    if (outcome.kind !== "published" || !relatedScenarioIds.has(outcome.id)) return [];
    const candidate = outcome.scenario.candidates.find((item) => item.tool.id === toolOutcome.tool.id);
    if (!candidate) return [];
    return [{
      scenarioId: outcome.id,
      scenarioSlug: outcome.slug,
      scenarioTitle: outcome.scenario.title,
      urlStateScenario: {
        slug: outcome.slug,
        dimensions: outcome.scenario.dimensions,
        candidates: outcome.scenario.candidates.map((item) => ({ tool: { slug: item.tool.slug } })),
      },
      scenarioGoal: outcome.scenario.goal,
      limitation: candidate.limitation,
      handsOnState: candidate.handsOnState,
      verificationChecklist: [...outcome.scenario.verificationChecklist],
    }];
  }).sort((left, right) => {
    const byTitle = left.scenarioTitle.localeCompare(right.scenarioTitle, "en", { sensitivity: "base" });
    return byTitle !== 0 ? byTitle : left.scenarioSlug.localeCompare(right.scenarioSlug, "en");
  });

  return { tool: toolOutcome.tool, contexts };
}

export function projectToolDetailPaths(assembly: PublicationAssembly) {
  return assembly.toolOutcomes.flatMap((outcome) => {
    if (outcome.kind !== "exposed-tool") return [];
    const detail = projectToolDetail(assembly, outcome.slug);
    return detail ? [{ params: { slug: outcome.slug }, props: { detail } }] : [];
  });
}

export interface ToolEntryContextInput {
  scenarioSlug?: string | undefined;
  returnValue?: string | undefined;
  origin: string;
}

export function resolveToolEntryContext(
  detail: { contexts: readonly ToolContextReference[] },
  input: ToolEntryContextInput,
) {
  const context = detail.contexts.find((item) => item.scenarioSlug === input.scenarioSlug);
  if (!context) return { context: undefined, returnHref: undefined };

  const canonicalHref = decisionCanonicalPath(context.urlStateScenario);
  if (!input.returnValue) return { context, returnHref: canonicalHref };
  try {
    const returnUrl = new URL(input.returnValue, input.origin);
    if (returnUrl.origin === input.origin && returnUrl.pathname === canonicalHref) {
      const state = parseUrlState(context.urlStateScenario, {
        search: returnUrl.search,
        hash: returnUrl.hash,
      });
      const serialized = serializeUrlState(context.urlStateScenario, state);
      return {
        context,
        returnHref: `${canonicalHref}${serialized.search}${serialized.hash}`,
      };
    }
  } catch {
    // Fall through to the validated Scenario route.
  }
  return { context, returnHref: canonicalHref };
}
