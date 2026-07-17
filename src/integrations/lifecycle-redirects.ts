import { readFile, writeFile } from "node:fs/promises";

import type { AstroIntegration } from "astro";

import { assembleFilePublication, publicationContentFiles } from "../content/file-publication";
import { resolveBuildTarget } from "../content/build-target";
import {
  projectLifecycleRedirects,
  type LifecycleRedirect,
} from "../domain/lifecycle-routes";
import type { PublicationAssembly } from "../domain/model";

export function assertLifecycleReplacementsValid(publication: Pick<PublicationAssembly, "issues">) {
  const invalidReplacements = publication.issues.filter((issue) => issue.code === "invalid_replacement");
  if (invalidReplacements.length === 0) return;

  throw new Error([
    "Lifecycle replacement validation failed:",
    ...invalidReplacements.map((issue) => `${issue.path}: ${issue.message}`),
  ].join("\n"));
}

export function renderCloudflareRedirects(
  existing: string,
  lifecycleRedirects: readonly LifecycleRedirect[],
) {
  const lines = existing.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const seen = new Set(lines);

  for (const redirect of [...lifecycleRedirects].sort((left, right) => left.from.localeCompare(right.from, "en"))) {
    const rule = `${redirect.from} ${redirect.to} ${redirect.statusCode}`;
    if (!seen.has(rule)) {
      lines.push(rule);
      seen.add(rule);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function lifecycleRedirects(): AstroIntegration {
  let redirects: readonly LifecycleRedirect[] = [];

  return {
    name: "stackbriefs-lifecycle-redirects",
    hooks: {
      "astro:config:setup": async ({ addWatchFile, updateConfig }) => {
        publicationContentFiles.forEach((file) => addWatchFile(file));
        const publication = await assembleFilePublication({
          target: resolveBuildTarget(process.env.STACKBRIEFS_BUILD_TARGET),
          asOf: process.env.STACKBRIEFS_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
        });
        assertLifecycleReplacementsValid(publication);
        redirects = projectLifecycleRedirects(publication);
        updateConfig({
          redirects: Object.fromEntries(redirects.map((redirect) => [
            redirect.from,
            { destination: redirect.to, status: redirect.statusCode },
          ])),
        });
      },
      "astro:build:done": async ({ dir }) => {
        const redirectsFile = new URL("_redirects", dir);
        const existing = await readFile(redirectsFile, "utf8").catch(() => "");
        await writeFile(redirectsFile, renderCloudflareRedirects(existing, redirects), "utf8");
      },
    },
  };
}
