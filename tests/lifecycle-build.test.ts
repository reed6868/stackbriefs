import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  buildLifecycleProject,
  createLifecycleProject,
  removeLifecycleProject,
} from "./support/lifecycle-project";

describe("lifecycle production build", () => {
  let projectRoot = "";
  let output = "";

  beforeAll(async () => {
    projectRoot = await createLifecycleProject();
    output = join(projectRoot, "dist");
    await buildLifecycleProject(projectRoot);
  }, 120_000);

  afterAll(async () => {
    await removeLifecycleProject(projectRoot);
  });

  it("builds noindex status pages without leaking them into discovery", async () => {
    const [home, retiredTool, blockedTool] = await Promise.all([
      readFile(join(output, "index.html"), "utf8"),
      readFile(join(output, "tool/alpha-writer.html"), "utf8"),
      readFile(join(output, "tool/bravo-draft.html"), "utf8"),
    ]);

    expect(home).toContain('/decision/meeting-assistants');
    expect(home).not.toMatch(/writing-assistants|alpha-writer|bravo-draft|never-launched/);
    expect(retiredTool).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(retiredTool).toContain('data-status="retired"');
    expect(blockedTool).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(blockedTool).toContain('data-status="blocked"');
    await expect(access(join(output, "tool/never-launched.html"))).rejects.toThrow();
  });

  it("builds the permanent replacement and Cloudflare redirect rule", async () => {
    const [redirectPage, redirects, replacement] = await Promise.all([
      readFile(join(output, "decision/writing-assistants.html"), "utf8"),
      readFile(join(output, "_redirects"), "utf8"),
      readFile(join(output, "decision/meeting-assistants.html"), "utf8"),
    ]);

    expect(redirectPage).toContain("/decision/meeting-assistants");
    expect(redirects).toContain("/decision/writing-assistants /decision/meeting-assistants 301");
    expect(replacement).toContain("AI meeting assistants for client calls");
  });

  it("fails build validation for an invalid replacement", async () => {
    const invalidProject = await createLifecycleProject({ invalidReplacement: true });

    try {
      await expect(buildLifecycleProject(invalidProject)).rejects.toThrow(
        /Lifecycle replacement validation failed:[\s\S]*meeting-assistants[\s\S]*does not produce a published Scenario outcome/,
      );
    } finally {
      await removeLifecycleProject(invalidProject);
    }
  }, 120_000);
});
