import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import type { ContentGraph, PublicationHistory } from "../../src/content/schema";

const execFileAsync = promisify(execFile);
const sourceRoot = fileURLToPath(new URL("../..", import.meta.url));
const dependenciesRoot = dirname(dirname(fileURLToPath(import.meta.resolve("astro/package.json"))));
const excludedRoots = new Set([
  ".astro",
  ".git",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const firstPublishedAt = "2026-07-10";

async function readJson<Value>(path: string): Promise<Value> {
  return JSON.parse(await readFile(path, "utf8")) as Value;
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeLifecycleContent(projectRoot: string, invalidReplacement: boolean) {
  const contentRoot = join(projectRoot, "src/content");
  const paths = {
    scenarios: join(contentRoot, "scenarios/index.json"),
    tools: join(contentRoot, "tools/index.json"),
    candidates: join(contentRoot, "candidates/index.json"),
    sources: join(contentRoot, "sources/index.json"),
    offers: join(contentRoot, "offers/index.json"),
    publicationHistory: join(contentRoot, "publication-history.json"),
  };
  const graph: ContentGraph = {
    scenarios: await readJson(paths.scenarios),
    tools: await readJson(paths.tools),
    candidates: await readJson(paths.candidates),
    sources: await readJson(paths.sources),
    offers: await readJson(paths.offers),
  };

  for (const collection of Object.values(graph)) {
    collection.forEach((record) => {
      record.fixture = false;
    });
  }

  const writing = graph.scenarios.find((scenario) => scenario.id === "scenario-writing-assistants")!;
  writing.status = "retired";
  writing.firstPublishedAt = firstPublishedAt;
  writing.replacementSlug = "meeting-assistants";

  const meetings = graph.scenarios.find((scenario) => scenario.id === "scenario-meeting-assistants")!;
  meetings.firstPublishedAt = firstPublishedAt;
  meetings.candidateIds.push("candidate-meetings-echo");

  const alpha = graph.tools.find((tool) => tool.id === "tool-alpha")!;
  alpha.status = "retired";
  alpha.firstPublishedAt = firstPublishedAt;
  delete alpha.replacementSlug;

  const bravo = graph.tools.find((tool) => tool.id === "tool-bravo")!;
  bravo.status = "draft";
  bravo.firstPublishedAt = firstPublishedAt;

  const charlie = graph.tools.find((tool) => tool.id === "tool-charlie")!;
  const delta = graph.tools.find((tool) => tool.id === "tool-delta")!;
  charlie.firstPublishedAt = firstPublishedAt;
  if (invalidReplacement) charlie.status = "draft";
  delta.firstPublishedAt = firstPublishedAt;
  graph.tools.push({
    ...structuredClone(delta),
    id: "tool-echo",
    slug: "echo-minutes",
    name: "Echo Minutes",
    summary: "A lifecycle build fixture for meeting-note workflows.",
    officialUrl: "https://echo.example/",
  });
  graph.tools.push({
    fixture: false,
    id: "tool-never-launched",
    slug: "never-launched",
    status: "draft",
    lastReviewedAt: "2026-07-16",
    name: "Never Launched",
    summary: "A lifecycle build fixture that has never been published.",
    officialUrl: "https://never-launched.example/",
  });

  const deltaCandidate = graph.candidates.find((candidate) => candidate.id === "candidate-meetings-delta")!;
  graph.candidates.push({
    ...structuredClone(deltaCandidate),
    id: "candidate-meetings-echo",
    toolId: "tool-echo",
    limitation: "Lifecycle build fixture observations mirror the documented team-plan shape.",
  });
  graph.sources.push(...graph.sources
    .filter((source) => source.subjectId === "candidate-meetings-delta")
    .map((source) => ({
      ...structuredClone(source),
      id: source.id.replace("delta", "echo"),
      subjectId: "candidate-meetings-echo",
      sourceUrl: source.sourceUrl.replace("delta.example", "echo.example"),
    })));

  const publicationHistory: PublicationHistory = [
    ...graph.scenarios
      .filter((scenario) => scenario.firstPublishedAt)
      .map((scenario) => ({
        recordType: "scenario" as const,
        id: scenario.id,
        slug: scenario.slug,
        firstPublishedAt: scenario.firstPublishedAt!,
      })),
    ...graph.tools
      .filter((tool) => tool.firstPublishedAt)
      .map((tool) => ({
        recordType: "tool" as const,
        id: tool.id,
        slug: tool.slug,
        firstPublishedAt: tool.firstPublishedAt!,
      })),
  ];

  await Promise.all([
    writeJson(paths.scenarios, graph.scenarios),
    writeJson(paths.tools, graph.tools),
    writeJson(paths.candidates, graph.candidates),
    writeJson(paths.sources, graph.sources),
    writeJson(paths.offers, graph.offers),
    writeJson(paths.publicationHistory, publicationHistory),
  ]);
}

export async function createLifecycleProject(options: { invalidReplacement?: boolean } = {}) {
  const projectRoot = await mkdtemp(join(tmpdir(), "stackbriefs-lifecycle-"));
  await cp(sourceRoot, projectRoot, {
    recursive: true,
    filter: (source) => {
      const path = relative(sourceRoot, source);
      return path === "" || !excludedRoots.has(path.split("/")[0]!);
    },
  });
  await symlink(dependenciesRoot, join(projectRoot, "node_modules"), "dir");
  await writeLifecycleContent(projectRoot, options.invalidReplacement ?? false);
  return projectRoot;
}

export async function buildLifecycleProject(projectRoot: string) {
  await execFileAsync(join(projectRoot, "node_modules/.bin/astro"), ["build"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      STACKBRIEFS_BUILD_TARGET: "production",
      STACKBRIEFS_BUILD_DATE: "2026-07-17",
    },
    timeout: 120_000,
  });
}

export async function removeLifecycleProject(projectRoot: string) {
  if (basename(projectRoot).startsWith("stackbriefs-lifecycle-")) {
    await rm(projectRoot, { recursive: true, force: true });
  }
}
