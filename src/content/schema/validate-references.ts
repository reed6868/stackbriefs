import type { ContentGraph, GraphIssue } from "./graph-types";
import { issue } from "./graph-types";
import { validateDimensionObservation, validateOfferObservation } from "./observed-values";

function findDuplicate(values: readonly string[]) {
  const seen = new Set<string>();
  return values.find((value) => (seen.has(value) ? true : !seen.add(value)));
}

function validateUniqueIdentity(graph: ContentGraph, issues: GraphIssue[]) {
  for (const [collection, records] of Object.entries(graph) as Array<
    [keyof ContentGraph, Array<{ id: string }>]
  >) {
    const duplicate = findDuplicate(records.map((record) => record.id));
    if (duplicate) {
      const index = records.findIndex((record) => record.id === duplicate);
      issues.push(issue(collection, index, "id", `duplicate immutable ID "${duplicate}"`));
    }
  }

  for (const [collection, records] of [
    ["scenarios", graph.scenarios],
    ["tools", graph.tools],
  ] as const) {
    const duplicate = findDuplicate(records.map((record) => record.slug));
    if (duplicate) {
      const index = records.findIndex((record) => record.slug === duplicate);
      issues.push(issue(collection, index, "slug", `duplicate immutable slug "${duplicate}"`));
    }
  }
}

export function validateReferences(graph: ContentGraph) {
  const issues: GraphIssue[] = [];
  validateUniqueIdentity(graph, issues);

  const scenarios = new Map(graph.scenarios.map((record) => [record.id, record]));
  const tools = new Map(graph.tools.map((record) => [record.id, record]));
  const candidates = new Map(graph.candidates.map((record) => [record.id, record]));
  const sources = new Map(graph.sources.map((record) => [record.id, record]));
  const offers = new Map(graph.offers.map((record) => [record.id, record]));
  const scenarioSlugs = new Map(graph.scenarios.map((record) => [record.slug, record]));
  const toolSlugs = new Map(graph.tools.map((record) => [record.slug, record]));
  const candidateToolsByScenario = new Map<string, Set<string>>();

  graph.scenarios.forEach((scenario, scenarioIndex) => {
    if (scenario.replacementSlug) {
      const replacement = scenarioSlugs.get(scenario.replacementSlug);
      if (!replacement || replacement.status !== "published" || replacement.id === scenario.id) {
        issues.push(
          issue(
            "scenarios",
            scenarioIndex,
            "replacementSlug",
            `must reference a different published Scenario, received "${scenario.replacementSlug}"`,
          ),
        );
      } else if (replacement.fixture !== scenario.fixture) {
        issues.push(issue("scenarios", scenarioIndex, "replacementSlug", "replacement must have matching fixture provenance"));
      }
    }

    scenario.candidateIds.forEach((candidateId) => {
      const candidate = candidates.get(candidateId);
      if (!candidate) {
        issues.push(issue("scenarios", scenarioIndex, "candidateIds", `referenced Candidate "${candidateId}" does not exist`));
      } else if (candidate.scenarioId !== scenario.id) {
        issues.push(
          issue(
            "scenarios",
            scenarioIndex,
            "candidateIds",
            `Candidate "${candidateId}" belongs to Scenario "${candidate.scenarioId}"`,
          ),
        );
      } else if (!scenario.fixture && candidate.fixture) {
        issues.push(
          issue(
            "scenarios",
            scenarioIndex,
            "candidateIds",
            `non-fixture Scenario cannot reference fixture Candidate "${candidateId}"`,
          ),
        );
      }
    });
  });

  graph.tools.forEach((tool, toolIndex) => {
    if (!tool.replacementSlug) return;
    const replacement = toolSlugs.get(tool.replacementSlug);
    if (!replacement || replacement.status !== "published" || replacement.id === tool.id) {
      issues.push(
        issue(
          "tools",
          toolIndex,
          "replacementSlug",
          `must reference a different published Tool, received "${tool.replacementSlug}"`,
        ),
      );
    } else if (replacement.fixture !== tool.fixture) {
      issues.push(issue("tools", toolIndex, "replacementSlug", "replacement must have matching fixture provenance"));
    }
  });

  graph.candidates.forEach((candidate, candidateIndex) => {
    const scenario = scenarios.get(candidate.scenarioId);
    const tool = tools.get(candidate.toolId);
    const scenarioTools = candidateToolsByScenario.get(candidate.scenarioId) ?? new Set<string>();

    if (!scenario) {
      issues.push(
        issue("candidates", candidateIndex, "scenarioId", `referenced Scenario "${candidate.scenarioId}" does not exist`),
      );
    } else if (!scenario.candidateIds.includes(candidate.id)) {
      issues.push(
        issue(
          "candidates",
          candidateIndex,
          "scenarioId",
          `Scenario "${candidate.scenarioId}" does not list Candidate "${candidate.id}"`,
        ),
      );
    }
    if (!tool) {
      issues.push(issue("candidates", candidateIndex, "toolId", `referenced Tool "${candidate.toolId}" does not exist`));
    }
    if (scenarioTools.has(candidate.toolId)) {
      issues.push(
        issue(
          "candidates",
          candidateIndex,
          "toolId",
          `Scenario/Tool pair "${candidate.scenarioId}/${candidate.toolId}" must be unique`,
        ),
      );
    }
    scenarioTools.add(candidate.toolId);
    candidateToolsByScenario.set(candidate.scenarioId, scenarioTools);

    if (!candidate.fixture && scenario?.fixture) {
      issues.push(issue("candidates", candidateIndex, "scenarioId", "non-fixture Candidate cannot reference a fixture Scenario"));
    }
    if (!candidate.fixture && tool?.fixture) {
      issues.push(issue("candidates", candidateIndex, "toolId", "non-fixture Candidate cannot reference a fixture Tool"));
    }

    const dimensions = new Set(scenario?.dimensions.map((dimension) => dimension.id) ?? []);
    Object.keys(candidate.claimBindings).forEach((dimensionId) => {
      if (!dimensions.has(dimensionId)) {
        issues.push(
          issue(
            "candidates",
            candidateIndex,
            "claimBindings",
            `dimension "${dimensionId}" does not belong to Scenario "${candidate.scenarioId}"`,
          ),
        );
      }
    });
  });

  graph.sources.forEach((source, sourceIndex) => {
    const subject =
      source.subjectType === "candidate"
        ? candidates.get(source.subjectId)
        : source.subjectType === "tool"
          ? tools.get(source.subjectId)
          : offers.get(source.subjectId);

    if (!subject) {
      issues.push(
        issue(
          "sources",
          sourceIndex,
          "subjectId",
          `referenced ${source.subjectType} subject "${source.subjectId}" does not exist`,
        ),
      );
      return;
    }
    if (source.fixture !== subject.fixture) {
      issues.push(issue("sources", sourceIndex, "subjectId", "Source and subject must have matching fixture provenance"));
    }
    if (source.subjectType === "offer") {
      const offer = offers.get(source.subjectId)!;
      if (!offer.evidenceIds.includes(source.id)) {
        issues.push(
          issue(
            "sources",
            sourceIndex,
            "claimKey",
            `claim does not resolve because Offer "${offer.id}" does not reference this Source`,
          ),
        );
        return;
      }
      const valueIssue = validateOfferObservation(source, offer);
      if (valueIssue) issues.push(issue("sources", sourceIndex, "observedValue", valueIssue));
      return;
    }

    const matchingDimensions = graph.candidates.flatMap((candidate) => {
      const matchesSubject =
        source.subjectType === "candidate" ? candidate.id === source.subjectId : candidate.toolId === source.subjectId;
      if (!matchesSubject) return [];
      const scenario = scenarios.get(candidate.scenarioId);
      return Object.entries(candidate.claimBindings).flatMap(([dimensionId, binding]) => {
        if (binding.subjectType !== source.subjectType || binding.claimKey !== source.claimKey) return [];
        const dimension = scenario?.dimensions.find((item) => item.id === dimensionId);
        return dimension ? [dimension] : [];
      });
    });

    if (matchingDimensions.length === 0) {
      issues.push(issue("sources", sourceIndex, "claimKey", "claim does not resolve through any Scenario Candidate binding"));
      return;
    }
    matchingDimensions.forEach((dimension) => {
      const valueIssue = validateDimensionObservation(source, dimension);
      if (valueIssue) issues.push(issue("sources", sourceIndex, "observedValue", valueIssue));
    });
  });

  graph.offers.forEach((offer, offerIndex) => {
    const tool = tools.get(offer.toolId);
    if (!tool) {
      issues.push(issue("offers", offerIndex, "toolId", `referenced Tool "${offer.toolId}" does not exist`));
    } else if (!offer.fixture && tool.fixture) {
      issues.push(issue("offers", offerIndex, "toolId", "non-fixture Offer cannot reference a fixture Tool"));
    }

    offer.evidenceIds.forEach((evidenceId) => {
      const source = sources.get(evidenceId);
      if (!source) {
        issues.push(issue("offers", offerIndex, "evidenceIds", `referenced Source "${evidenceId}" does not exist`));
      } else if (source.subjectType !== "offer" || source.subjectId !== offer.id) {
        issues.push(issue("offers", offerIndex, "evidenceIds", `Source "${evidenceId}" must target Offer "${offer.id}"`));
      } else if (source.fixture !== offer.fixture) {
        issues.push(issue("offers", offerIndex, "evidenceIds", "Offer and Source must have matching fixture provenance"));
      }
    });
  });

  return issues;
}
