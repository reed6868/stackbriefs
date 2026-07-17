import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

import { sortHomeScenarios } from "../src/domain/home-discovery";
import HomePage from "../src/pages/index.astro";

const expectedOrder = ["meeting-assistants", "writing-assistants"];
const orderFixtures = [
  { slug: "writing-assistants", title: "Writing assistants for small teams" },
  { slug: "meeting-assistants", title: "AI meeting assistants for client calls" },
] as const;
const renderScenarios = orderFixtures.map((scenario, index) => ({
  ...scenario,
  goal: index === 0 ? "Choose a writing assistant." : "Choose a meeting assistant.",
  prerequisite: "Human review is available.",
  suitableFor: "Small teams.",
  notSuitableFor: "Autonomous high-risk use.",
  candidateCount: 2,
  dimensionCount: index === 0 ? 3 : 4,
  lastReviewedAt: "2026-07-16",
  fixture: true,
}));

describe("Home discovery", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it("sorts Scenario fixtures by normalized title and then slug without mutating input", () => {
    const input = [...orderFixtures].reverse();
    const before = input.map((scenario) => scenario.slug);

    expect(sortHomeScenarios(input).map((scenario) => scenario.slug)).toEqual(expectedOrder);
    expect(input.map((scenario) => scenario.slug)).toEqual(before);
  });

  it("ignores commercial and popularity-only mutations", () => {
    const mutated = orderFixtures.map((scenario, index) => ({
      ...scenario,
      affiliateValue: index === 0 ? 10_000 : 0,
      deal: index === 0 ? "Featured deal" : undefined,
      popularity: index === 0 ? 1_000_000 : 1,
      rating: index === 0 ? 5 : 1,
    }));

    expect(sortHomeScenarios(mutated).map((scenario) => scenario.slug)).toEqual(expectedOrder);
  });

  it("renders the product promise, ordered Scenario rows, process, and trust routes", async () => {
    const html = await container.renderToString(HomePage, {
      props: { scenarios: renderScenarios },
      request: new Request("https://stackbriefs.test/"),
    });

    expect(html.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(html).toContain('id="scenarios"');
    expect(html).toContain('id="how-it-works"');
    expect(html).toContain('id="trust"');
    expect(html).toContain("Start with a use case. Narrow the options. Choose with confidence.");

    const meetingIndex = html.indexOf('href="/decision/meeting-assistants"');
    const writingIndex = html.indexOf('href="/decision/writing-assistants"');

    expect(meetingIndex).toBeGreaterThan(-1);
    expect(writingIndex).toBeGreaterThan(meetingIndex);
    expect(html).toContain("Prerequisite");
    expect(html).toContain("Suitable for");
    expect(html).toContain("Not suitable for");
    expect(html).toContain("2 candidates");
    expect(html).toContain("3 dimensions");
    expect(html).toContain("4 dimensions");
    expect(html).toContain("Last reviewed");
    expect(html).toContain("Narrow");
    expect(html).toContain("Compare");
    expect(html).toContain("Verify");
    expect(html).toContain('href="/methodology"');
    expect(html).toContain('href="/affiliate-disclosure"');

    for (const prohibited of ["rating", "popularity", "featured", "deal", "affiliate value"]) {
      expect(html.toLowerCase()).not.toContain(prohibited);
    }
  });
});
