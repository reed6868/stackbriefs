import { readFile } from "node:fs/promises";

import { beforeAll, describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import type { DomainCandidate, PublicationAssembly } from "../src/domain/model";
import { assemblePublication } from "../src/domain/publication";
import {
  projectToolDetail,
  projectToolDetailPaths,
  resolveToolEntryContext,
} from "../src/domain/tool-detail";

async function readCollection<Name extends keyof ContentGraph>(name: Name): Promise<ContentGraph[Name]> {
  return JSON.parse(await readFile(new URL(`../src/content/${name}/index.json`, import.meta.url), "utf8"));
}

async function loadGraph(): Promise<ContentGraph> {
  return {
    scenarios: await readCollection("scenarios"),
    tools: await readCollection("tools"),
    candidates: await readCollection("candidates"),
    sources: await readCollection("sources"),
    offers: await readCollection("offers"),
  };
}

function withSecondAlphaContext(assembly: PublicationAssembly): PublicationAssembly {
  const writing = assembly.scenarioOutcomes.find((outcome) =>
    outcome.kind === "published" && outcome.slug === "writing-assistants");
  const meetings = assembly.scenarioOutcomes.find((outcome) =>
    outcome.kind === "published" && outcome.slug === "meeting-assistants");
  expect(writing?.kind).toBe("published");
  expect(meetings?.kind).toBe("published");
  if (writing?.kind !== "published" || meetings?.kind !== "published") return assembly;

  const alpha = writing.scenario.candidates.find((candidate) => candidate.tool.slug === "alpha-writer")!;
  const meetingTemplate = meetings.scenario.candidates[0]!;
  const meetingAlpha: DomainCandidate = {
    ...structuredClone(meetingTemplate),
    id: "candidate-meetings-alpha",
    scenarioId: meetings.id,
    toolId: alpha.tool.id,
    tool: structuredClone(alpha.tool),
    limitation: "A deliberately long Scenario-specific limitation remains complete even when the Tool has another published context.",
    handsOnState: "tested",
  };

  return {
    ...assembly,
    scenarioOutcomes: assembly.scenarioOutcomes.map((outcome) =>
      outcome === meetings
        ? {
            ...meetings,
            scenario: {
              ...meetings.scenario,
              candidates: [...meetings.scenario.candidates, meetingAlpha],
            },
          }
        : outcome),
    toolOutcomes: assembly.toolOutcomes.map((outcome) =>
      outcome.kind === "exposed-tool" && outcome.slug === "alpha-writer"
        ? { ...outcome, scenarioIds: [writing.id, meetings.id] }
        : outcome),
  };
}

describe("Tool detail projection", () => {
  let publication: PublicationAssembly;

  beforeAll(async () => {
    publication = assemblePublication(await loadGraph(), {
      target: "development",
      asOf: "2026-07-17",
    });
  });

  it("projects neutral identity and ordered Scenario-specific context", () => {
    const detail = projectToolDetail(publication, "alpha-writer")!;

    expect(detail.tool).toMatchObject({
      slug: "alpha-writer",
      name: "Alpha Writer",
      officialUrl: "https://alpha.example/",
    });
    expect(detail.contexts.map((context) => context.scenarioSlug)).toEqual(["writing-assistants"]);
    expect(detail.contexts[0]).toMatchObject({
      scenarioTitle: "Writing assistants for small teams",
      limitation: "Fixture observations cover only the documented team plan.",
      handsOnState: "partially_tested",
      verificationChecklist: [
        "Confirm current commercial-use terms for the evaluated plan.",
        "Verify export formats in the current product interface.",
      ],
    });
    expect(JSON.stringify(detail)).not.toMatch(/winner|score|rank|affiliate|offer/i);
  });

  it("sorts multiple published contexts without turning them into global fit", () => {
    const detail = projectToolDetail(withSecondAlphaContext(publication), "alpha-writer")!;

    expect(detail.contexts.map((context) => context.scenarioSlug)).toEqual([
      "meeting-assistants",
      "writing-assistants",
    ]);
    expect(detail.contexts[0]!.limitation).toContain("Scenario-specific limitation");
    expect(detail.contexts[1]!.limitation).toContain("documented team plan");
    expect(detail).not.toHaveProperty("fit");
  });

  it("returns no projection for hidden or unknown Tools", () => {
    const hidden: PublicationAssembly = {
      ...publication,
      toolOutcomes: publication.toolOutcomes.map((outcome) =>
        outcome.slug === "alpha-writer"
          ? { kind: "hidden", id: outcome.id, slug: outcome.slug, fixture: outcome.fixture, reason: "not_exposed" }
          : outcome),
    };

    expect(projectToolDetail(hidden, "alpha-writer")).toBeUndefined();
    expect(projectToolDetail(publication, "missing-tool")).toBeUndefined();
    expect(projectToolDetailPaths(hidden).map((path) => path.params.slug)).not.toContain("alpha-writer");
    expect(projectToolDetailPaths(publication).map((path) => path.params.slug)).toEqual([
      "alpha-writer",
      "bravo-draft",
      "charlie-meet",
      "delta-notes",
    ]);
  });

  it("accepts only a related Scenario and a same-origin matching return path", () => {
    const detail = projectToolDetail(publication, "alpha-writer")!;
    const valid = resolveToolEntryContext(detail, {
      scenarioSlug: "writing-assistants",
      returnValue: "/decision/writing-assistants?r=export-formats:pdf&shortlist=alpha-writer,bravo-draft#comparison",
      origin: "https://stackbriefs.test",
    });
    expect(valid).toMatchObject({
      context: { scenarioSlug: "writing-assistants" },
      returnHref: "/decision/writing-assistants?r=export-formats:pdf&shortlist=alpha-writer,bravo-draft#comparison",
    });

    const crossOrigin = resolveToolEntryContext(detail, {
      scenarioSlug: "writing-assistants",
      returnValue: "https://attacker.example/steal",
      origin: "https://stackbriefs.test",
    });
    expect(crossOrigin.returnHref).toBe("/decision/writing-assistants");

    const invalidState = resolveToolEntryContext(detail, {
      scenarioSlug: "writing-assistants",
      returnValue: "/decision/writing-assistants?garbage=1&r=missing:value#bogus",
      origin: "https://stackbriefs.test",
    });
    expect(invalidState.returnHref).toBe("/decision/writing-assistants");

    expect(resolveToolEntryContext(detail, {
      scenarioSlug: "meeting-assistants",
      returnValue: "/decision/meeting-assistants",
      origin: "https://stackbriefs.test",
    })).toEqual({ context: undefined, returnHref: undefined });
  });
});
