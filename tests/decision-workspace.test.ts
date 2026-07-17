import { readFile } from "node:fs/promises";

import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import DecisionWorkspace from "../src/components/decision/DecisionWorkspace.astro";
import {
  evaluateDecision,
  type DecisionCondition,
} from "../src/domain/decision";
import type { DomainScenario, PublicationAssembly } from "../src/domain/model";
import { assemblePublication } from "../src/domain/publication";

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

function publishedScenario(assembly: PublicationAssembly, slug: string): DomainScenario {
  const outcome = assembly.scenarioOutcomes.find((candidate) => candidate.slug === slug);
  expect(outcome?.kind).toBe("published");
  return (outcome as Extract<typeof outcome, { kind: "published" }>).scenario;
}

function condition(
  dimensionId: string,
  value: DecisionCondition["value"],
  mode: DecisionCondition["mode"] = "required",
): DecisionCondition {
  return { dimensionId, value, mode };
}

describe("static Decision workspace", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let writing: DomainScenario;
  let meetings: DomainScenario;

  beforeAll(async () => {
    container = await AstroContainer.create();
    const publication = assemblePublication(await loadGraph(), {
      target: "development",
      asOf: "2026-07-17",
    });
    writing = publishedScenario(publication, "writing-assistants");
    meetings = publishedScenario(publication, "meeting-assistants");
  });

  async function render(scenario: DomainScenario, conditions: readonly DecisionCondition[] = []) {
    return container.renderToString(DecisionWorkspace, {
      props: { scenario, evaluation: evaluateDecision(scenario, conditions) },
    });
  }

  it("keeps heterogeneous Scenario boundaries, criteria, and Candidates isolated", async () => {
    const [writingHtml, meetingHtml] = await Promise.all([
      render(writing),
      render(meetings),
    ]);

    expect(writingHtml).toContain("Writing assistants for small teams");
    expect(writingHtml).toContain("A human reviews generated text before publication.");
    expect(writingHtml).toContain("Commercial use permitted");
    expect(writingHtml).toContain("Export formats");
    expect(writingHtml).toContain("Alpha Writer");
    expect(writingHtml).toContain("Bravo Draft");
    expect(writingHtml).not.toContain("Hosting region");
    expect(writingHtml).not.toContain("Charlie Meet");

    expect(meetingHtml).toContain("AI meeting assistants for client calls");
    expect(meetingHtml).toContain("Participants can be notified when recording or transcription is active.");
    expect(meetingHtml).toContain("Maximum retention");
    expect(meetingHtml).toContain("Hosting region");
    expect(meetingHtml).toContain("Charlie Meet");
    expect(meetingHtml).toContain("Delta Notes");
    expect(meetingHtml).not.toContain("Export formats");
    expect(meetingHtml).not.toContain("Alpha Writer");
  });

  it("renders Scenario-derived native filter controls behind the static fallback", async () => {
    const html = await render(writing);
    const serializedScenario = html.match(/data-decision-scenario="([^"]+)"/)?.[1];

    expect(html.match(/data-filter-control(?:\s|>)/g)).toHaveLength(6);
    expect(html).toContain('data-decision-filter-form="desktop"');
    expect(html).toContain('data-decision-filter-form="mobile"');
    expect(html).toContain('data-filter-dialog-trigger hidden');
    expect(html).toContain('data-desktop-filter-panel hidden');
    expect(html).toContain('data-static-criteria');
    expect(html).toContain('aria-labelledby="filter-dialog-title"');
    expect(html).toContain("Use Commercial use permitted as");
    expect(html).toContain("Commercial use permitted value");
    expect(html).toContain('<option value="required">Required</option>');
    expect(html).toContain('<option value="optional">Optional</option>');
    expect(serializedScenario).toBeTruthy();

    const scenarioData = JSON.parse(decodeURIComponent(serializedScenario!));
    expect(scenarioData.slug).toBe("writing-assistants");
    expect(scenarioData.dimensions.map((dimension: { id: string }) => dimension.id)).toEqual([
      "commercial-use",
      "export-formats",
      "collaboration-mode",
    ]);
    expect(JSON.stringify(scenarioData)).not.toMatch(/affiliate|offer/i);
  });

  it("renders shortlist controls and a hidden Scenario-scoped dock for enhancement", async () => {
    const html = await render(writing);

    expect(html.match(/data-shortlist-toggle(?:\s|>)/g)).toHaveLength(4);
    expect(html.match(/data-shortlist-item=/g)).toHaveLength(2);
    expect(html).toContain('data-shortlist-dock hidden');
    expect(html).toContain('data-shortlist-count aria-live="polite"');
    expect(html).toMatch(/data-compare-shortlist[^>]*disabled/);
    expect(html).toContain("Choose at least two Tools to compare.");
    expect(html).toContain('id="shortlist-limit-reason"');
    expect(html).toContain("Shortlist is full. Remove a Tool before adding another.");
    expect(html).toContain('data-shortlist-message aria-live="polite" hidden');
    expect(html).toContain('data-tool-slug="alpha-writer"');
    expect(html).toContain('data-tool-slug="bravo-draft"');
    expect(html).not.toMatch(/localStorage|sessionStorage|cookie/i);
  });

  it("renders a hidden semantic comparison table shell for the active Scenario", async () => {
    const html = await render(writing);

    expect(html).toContain('data-comparison-section hidden');
    expect(html).toContain('<table data-comparison-table>');
    expect(html).toContain("Comparison of shortlisted Tools for Writing assistants for small teams");
    expect(html).toContain('<th scope="col">Decision factor</th>');
    expect(html).toContain('<th scope="row">Commercial use permitted</th>');
    expect(html).toContain('<th scope="row">Export formats</th>');
    expect(html).toContain('<th scope="row">Collaboration mode</th>');
    expect(html).toContain('<th scope="row">Limitation</th>');
    expect(html.match(/data-comparison-tool=/g)).toHaveLength(2);
    expect(html.match(/data-comparison-cell=/g)).toHaveLength(6);
    expect(html.match(/data-comparison-limitation=/g)).toHaveLength(2);
    expect(html).not.toMatch(/winner|score|rank/i);
  });

  it("renders match, no-match, and unknown labels with ordered explanations", async () => {
    const writingHtml = await render(writing, [
      condition("collaboration-mode", "shared-workspace"),
      condition("commercial-use", true),
      condition("export-formats", "docx", "optional"),
    ]);
    const matchIndex = writingHtml.indexOf("Commercial use permitted matches");
    const optionalIndex = writingHtml.indexOf("Export formats matches optional preference");
    const limitationIndex = writingHtml.indexOf("Fixture observations cover only the documented team plan.");

    expect(writingHtml).toContain('data-evaluation-state="match"');
    expect(writingHtml).toContain('data-evaluation-state="no_match"');
    expect(writingHtml).toContain("Does not match");
    expect(matchIndex).toBeGreaterThan(-1);
    expect(optionalIndex).toBeGreaterThan(matchIndex);
    expect(limitationIndex).toBeGreaterThan(optionalIndex);

    const uncertainMeetings = structuredClone(meetings);
    const charlie = uncertainMeetings.candidates.find((candidate) => candidate.id === "candidate-meetings-charlie")!;
    const consent = charlie.claims.find((claim) => claim.dimensionId === "consent-reminder")!;
    consent.evidence = {
      ...consent.evidence,
      state: "needs_recheck",
      value: undefined,
      explanation: "Consent evidence is stale",
    };
    const meetingHtml = await render(uncertainMeetings, [condition("consent-reminder", true)]);

    expect(meetingHtml).toContain('data-evaluation-state="unknown"');
    expect(meetingHtml).toContain("Unknown evidence");
    expect(meetingHtml).toContain("Needs recheck");
  });

  it("keeps evidence state, check dates, limitations, and exclusion reasons visible", async () => {
    const html = await render(writing, [condition("export-formats", "pdf")]);

    expect(html).toContain("Verified fact");
    expect(html).toContain('datetime="2026-07-16"');
    expect(html).toContain("Fixture observations cover only the documented team plan.");
    expect(html).toContain("Fixture observations cover only the documented individual plan.");
    expect(html).toContain("Export formats does not match the selected value");
    expect(html.match(/Checked <time datetime="2026-07-16"/g)).toHaveLength(4);
    expect(html).toContain('href="/tool/alpha-writer?scenario=writing-assistants"');
    expect(html).toContain('href="/tool/bravo-draft?scenario=writing-assistants"');
  });

  it("shows check dates only from sources selected by evidence resolution", async () => {
    const scenarioWithWrongScope = structuredClone(writing);
    const alpha = scenarioWithWrongScope.candidates.find((candidate) => candidate.id === "candidate-writing-alpha")!;
    const commercialUse = alpha.claims.find((claim) => claim.dimensionId === "commercial-use")!;
    commercialUse.sources = [
      ...commercialUse.sources,
      {
        ...commercialUse.sources[0]!,
        id: "source-writing-alpha-commercial-wrong-scope",
        lastCheckedAt: "2026-07-17",
        scope: { plan: "enterprise", region: "global" },
      },
    ];

    const html = await render(scenarioWithWrongScope);

    expect(html).not.toContain('Checked <time datetime="2026-07-17"');
    expect(html).toContain('Checked <time datetime="2026-07-16"');
  });

  it("renders explicit zero-result recovery without changing applied requirements", async () => {
    const html = await render(writing, [
      condition("export-formats", "pdf"),
      condition("collaboration-mode", "shared-workspace"),
    ]);

    expect(html).toContain("No tools match every required condition");
    expect(html).toContain("Review Export formats");
    expect(html).toContain("Alpha Writer could match if this requirement changes.");
    expect(html).toContain("Review Collaboration mode");
    expect(html).toContain("Bravo Draft could match if this requirement changes.");
    expect(html).toContain("No requirement has been changed automatically.");
  });
});
