import type { DomainCandidate, DomainScenario } from "../../src/domain/model";

export const extraWritingCandidates = [
  {
    id: "candidate-writing-charlie",
    toolId: "tool-charlie-compose",
    slug: "charlie-compose",
    name: "Charlie Compose",
  },
  {
    id: "candidate-writing-delta",
    toolId: "tool-delta-write",
    slug: "delta-write",
    name: "Delta Write",
  },
  {
    id: "candidate-writing-echo",
    toolId: "tool-echo-editor",
    slug: "echo-editor",
    name: "Echo Editor",
  },
] as const;

function cloneCandidate(
  template: DomainCandidate,
  candidate: typeof extraWritingCandidates[number],
) {
  return {
    ...structuredClone(template),
    id: candidate.id,
    toolId: candidate.toolId,
    tool: {
      ...structuredClone(template.tool),
      id: candidate.toolId,
      slug: candidate.slug,
      name: candidate.name,
    },
  };
}

function cloneCandidateMarkup(
  source: string,
  candidate: typeof extraWritingCandidates[number],
) {
  return source
    .replaceAll("candidate-writing-alpha", candidate.id)
    .replaceAll("alpha-writer", candidate.slug)
    .replaceAll("Alpha Writer", candidate.name);
}

export function expandWritingScenario(body: string) {
  const encodedScenario = body.match(/data-decision-scenario="([^"]+)"/)?.[1];
  if (!encodedScenario) throw new Error("Expanded writing fixture requires serialized Scenario data");
  const scenario = JSON.parse(decodeURIComponent(encodedScenario)) as DomainScenario;
  const template = scenario.candidates.find((candidate) => candidate.id === "candidate-writing-alpha");
  if (!template) throw new Error("Expanded writing fixture requires Alpha Writer");
  const expandedScenario = {
    ...scenario,
    candidates: [
      ...scenario.candidates,
      ...extraWritingCandidates.map((candidate) => cloneCandidate(template, candidate)),
    ],
  };

  let expanded = body.replace(
    encodedScenario,
    encodeURIComponent(JSON.stringify(expandedScenario)),
  );
  const fragments = [
    /<article class="candidate-card"[^>]*data-candidate-card="candidate-writing-alpha"[\s\S]*?<\/article>/,
    /<article class="excluded-candidate"[^>]*data-excluded-candidate="candidate-writing-alpha"[\s\S]*?<\/article>/,
    /<li data-shortlist-item="alpha-writer" hidden>[\s\S]*?<\/li>/,
    /<th scope="col" data-comparison-tool="alpha-writer" hidden>[\s\S]*?<\/th>/,
    /<td[^>]*data-comparison-cell="alpha-writer"[^>]*>[\s\S]*?<\/td>/,
    /<td data-comparison-limitation="alpha-writer" hidden>[\s\S]*?<\/td>/,
  ];
  fragments.forEach((pattern) => {
    const sources = [...expanded.matchAll(new RegExp(pattern.source, "g"))].map((match) => match[0]);
    if (sources.length === 0) {
      throw new Error(`Expanded writing fixture requires markup matching ${pattern}`);
    }
    sources.forEach((source) => {
      const clones = extraWritingCandidates
        .map((candidate) => cloneCandidateMarkup(source, candidate))
        .join("");
      expanded = expanded.replace(source, `${source}${clones}`);
    });
  });
  return expanded;
}
