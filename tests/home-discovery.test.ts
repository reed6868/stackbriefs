import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

import { homeScenarios, sortHomeScenarios } from "../src/fixtures/home-scenarios";
import HomePage from "../src/pages/index.astro";

const expectedOrder = ["meeting-assistants", "writing-assistants"];

describe("Home discovery", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it("sorts Scenario fixtures by normalized title and then slug without mutating input", () => {
    const input = [...homeScenarios].reverse();
    const before = input.map((scenario) => scenario.slug);

    expect(sortHomeScenarios(input).map((scenario) => scenario.slug)).toEqual(expectedOrder);
    expect(input.map((scenario) => scenario.slug)).toEqual(before);
  });

  it("ignores commercial and popularity-only mutations", () => {
    const mutated = homeScenarios.map((scenario, index) => ({
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
    expect(html).toContain("4 candidates");
    expect(html).toContain("5 dimensions");
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
