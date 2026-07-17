import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { ContentGraph } from "../src/content/schema";
import type { DecisionCondition } from "../src/domain/decision";
import type { DomainScenario, PublicationAssembly } from "../src/domain/model";
import { assemblePublication } from "../src/domain/publication";
import {
  decisionCanonicalPath,
  normalizeUrlState,
  parseUrlState,
  serializeUrlState,
  type UrlStateInput,
} from "../src/domain/url-state";

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

async function scenario(slug: string) {
  return publishedScenario(
    assemblePublication(await loadGraph(), { target: "development", asOf: "2026-07-17" }),
    slug,
  );
}

function condition(
  dimensionId: string,
  value: DecisionCondition["value"],
  mode: DecisionCondition["mode"],
): DecisionCondition {
  return { dimensionId, value, mode };
}

describe("URL state", () => {
  it("round-trips valid required, optional, shortlist, and comparison state without loss", async () => {
    const writing = await scenario("writing-assistants");
    const state = {
      conditions: [
        condition("commercial-use", true, "required"),
        condition("export-formats", "pdf", "optional"),
      ],
      shortlist: ["bravo-draft", "alpha-writer"],
      comparison: true,
    } satisfies UrlStateInput;

    const serialized = serializeUrlState(writing, state);
    expect(serialized).toEqual({
      search: "?r=commercial-use:true&p=export-formats:pdf&shortlist=bravo-draft,alpha-writer",
      hash: "#comparison",
    });
    expect(parseUrlState(writing, serialized)).toEqual(normalizeUrlState(writing, state));
  });

  it("uses an empty canonical representation when no valid temporary state remains", async () => {
    const writing = await scenario("writing-assistants");
    const state = parseUrlState(writing, { search: "?unknown=value&r=retention-days:", hash: "#other" });

    expect(state).toEqual({ conditions: [], shortlist: [], comparison: false });
    expect(serializeUrlState(writing, state)).toEqual({ search: "", hash: "" });
  });

  it.each(["07", "+7", "7e0", "0x7", "%207%20"])(
    "removes non-canonical numeric alias '%s'",
    async (alias) => {
      const meetings = await scenario("meeting-assistants");

      expect(parseUrlState(meetings, { search: `?r=retention-days:${alias}`, hash: "" }).conditions).toEqual([]);
      expect(parseUrlState(meetings, { search: "?r=retention-days:7", hash: "" }).conditions).toEqual([
        condition("retention-days", 7, "required"),
      ]);
    },
  );

  it("serializes conditions deterministically by mode and Scenario dimension order", async () => {
    const writing = await scenario("writing-assistants");
    const first = serializeUrlState(writing, {
      conditions: [
        condition("collaboration-mode", "shared-workspace", "optional"),
        condition("export-formats", "docx", "required"),
        condition("commercial-use", true, "required"),
      ],
      shortlist: [],
      comparison: false,
    });
    const second = serializeUrlState(writing, {
      conditions: [
        condition("commercial-use", true, "required"),
        condition("export-formats", "docx", "required"),
        condition("collaboration-mode", "shared-workspace", "optional"),
      ],
      shortlist: [],
      comparison: false,
    });

    expect(first).toEqual(second);
    expect(first.search).toBe(
      "?r=commercial-use:true&r=export-formats:docx&p=collaboration-mode:shared-workspace",
    );
  });

  it("removes invalid dimensions, values, modes, and duplicate dimensions", async () => {
    const writing = await scenario("writing-assistants");
    const normalized = parseUrlState(writing, {
      search: [
        "?x=commercial-use:true",
        "r=missing-dimension:true",
        "r=commercial-use:maybe",
        "r=commercial-use:true",
        "p=commercial-use:false",
        "p=export-formats:txt",
        "p=collaboration-mode:shared-workspace",
      ].join("&"),
      hash: "",
    });

    expect(normalized).toEqual({
      conditions: [
        condition("commercial-use", true, "required"),
        condition("collaboration-mode", "shared-workspace", "optional"),
      ],
      shortlist: [],
      comparison: false,
    });
    expect(serializeUrlState(writing, normalized).search).toBe(
      "?r=commercial-use:true&p=collaboration-mode:shared-workspace",
    );
  });

  it("uses the first valid mode for a Dimension instead of silently overwriting it", async () => {
    const writing = await scenario("writing-assistants");

    expect(parseUrlState(writing, {
      search: "?p=commercial-use:false&r=commercial-use:true",
      hash: "",
    }).conditions).toEqual([condition("commercial-use", false, "optional")]);
    expect(parseUrlState(writing, {
      search: "?r=commercial-use:true&p=commercial-use:false",
      hash: "",
    }).conditions).toEqual([condition("commercial-use", true, "required")]);
  });

  it("normalizes duplicate, deleted, and cross-Scenario shortlist Tools away", async () => {
    const writing = await scenario("writing-assistants");
    const state = parseUrlState(writing, {
      search: "?shortlist=alpha-writer,delta-notes,deleted-tool,alpha-writer&shortlist=bravo-draft",
      hash: "#comparison",
    });

    expect(state).toEqual({
      conditions: [],
      shortlist: ["alpha-writer", "bravo-draft"],
      comparison: true,
    });
  });

  it("keeps at most the first four valid current-Scenario Tools", async () => {
    const writing = structuredClone(await scenario("writing-assistants"));
    const template = writing.candidates[0]!;
    writing.candidates = [
      ...writing.candidates,
      ...["charlie", "delta", "echo"].map((slug, index) => ({
        ...structuredClone(template),
        id: `candidate-${slug}`,
        toolId: `tool-${slug}`,
        tool: {
          ...structuredClone(template.tool),
          id: `tool-${slug}`,
          slug,
          name: `Tool ${index + 3}`,
        },
      })),
    ];

    const state = parseUrlState(writing, {
      search: "?shortlist=alpha-writer,bravo-draft,charlie,delta,echo",
      hash: "#comparison",
    });
    expect(state.shortlist).toEqual(["alpha-writer", "bravo-draft", "charlie", "delta"]);
    expect(state.comparison).toBe(true);
  });

  it.each([
    { shortlist: "", hash: "#comparison", expected: false },
    { shortlist: "alpha-writer", hash: "#comparison", expected: false },
    { shortlist: "alpha-writer,bravo-draft", hash: "#comparison", expected: true },
    { shortlist: "alpha-writer,bravo-draft", hash: "#other", expected: false },
  ])("normalizes comparison for shortlist '$shortlist' and hash '$hash'", async ({ shortlist, hash, expected }) => {
    const writing = await scenario("writing-assistants");
    const search = shortlist ? `?shortlist=${shortlist}` : "";

    expect(parseUrlState(writing, { search, hash }).comparison).toBe(expected);
  });

  it("normalizes programmatic state through the same canonical rules without mutating input", async () => {
    const writing = await scenario("writing-assistants");
    const input = {
      conditions: [
        condition("export-formats", "pdf", "optional"),
        condition("export-formats", "docx", "required"),
        { dimensionId: "commercial-use", value: "invalid", mode: "required" } as unknown as DecisionCondition,
      ],
      shortlist: ["delta-notes", "alpha-writer", "alpha-writer", "bravo-draft"],
      comparison: true,
    } satisfies UrlStateInput;
    const snapshot = structuredClone(input);

    expect(normalizeUrlState(writing, input)).toEqual({
      conditions: [condition("export-formats", "pdf", "optional")],
      shortlist: ["alpha-writer", "bravo-draft"],
      comparison: true,
    });
    expect(input).toEqual(snapshot);
  });

  it("keeps heterogeneous Scenario state isolated", async () => {
    const writing = await scenario("writing-assistants");
    const meetings = await scenario("meeting-assistants");
    const location = {
      search: "?r=hosting-region:eu&p=export-formats:pdf&shortlist=alpha-writer,charlie-meet",
      hash: "#comparison",
    };

    expect(parseUrlState(writing, location)).toEqual({
      conditions: [condition("export-formats", "pdf", "optional")],
      shortlist: ["alpha-writer"],
      comparison: false,
    });
    expect(parseUrlState(meetings, location)).toEqual({
      conditions: [condition("hosting-region", "eu", "required")],
      shortlist: ["charlie-meet"],
      comparison: false,
    });
  });

  it("keeps temporary query and fragment state out of the canonical Decision path", async () => {
    const writing = await scenario("writing-assistants");
    const state = parseUrlState(writing, {
      search: "?r=commercial-use:true&shortlist=alpha-writer,bravo-draft",
      hash: "#comparison",
    });

    expect(decisionCanonicalPath(writing)).toBe("/decision/writing-assistants");
    expect(decisionCanonicalPath(writing)).not.toContain(serializeUrlState(writing, state).search);
    expect(decisionCanonicalPath(writing)).not.toContain("#comparison");
  });
});
