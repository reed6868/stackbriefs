import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildLifecycleProject,
  createLifecycleProject,
  removeLifecycleProject,
} from "./lifecycle-project.ts";

const validatorUrl = "https://validator.schema.org/validate";
const pages = [
  { route: "/", file: "index.html", expectedTypes: ["WebSite"] },
  { route: "/methodology", file: "methodology.html", expectedTypes: ["BreadcrumbList", "WebPage"] },
  {
    route: "/affiliate-disclosure",
    file: "affiliate-disclosure.html",
    expectedTypes: ["BreadcrumbList", "WebPage"],
  },
  {
    route: "/decision/meeting-assistants",
    file: "decision/meeting-assistants.html",
    expectedTypes: ["BreadcrumbList", "WebPage"],
  },
  {
    route: "/tool/echo-minutes",
    file: "tool/echo-minutes.html",
    expectedTypes: ["BreadcrumbList", "SoftwareApplication"],
  },
] as const;

interface ValidatorResponse {
  totalNumErrors: number;
  totalNumWarnings: number;
  tripleGroups: Array<{ type: string }>;
}

function parseValidatorResponse(source: string): ValidatorResponse {
  return JSON.parse(source.replace(/^\)\]\}'\n/, "")) as ValidatorResponse;
}

const projectRoot = await createLifecycleProject();

try {
  await buildLifecycleProject(projectRoot);
  const results = [];

  for (const page of pages) {
    const html = await readFile(join(projectRoot, "dist", page.file), "utf8");
    const jsonLd = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    if (!jsonLd) throw new Error(`${page.route} has no generated JSON-LD`);

    const response = await fetch(validatorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({
        html: `<!doctype html><html><head><script type="application/ld+json">${jsonLd}</script></head></html>`,
      }),
    });
    if (!response.ok) throw new Error(`Schema.org validator returned HTTP ${response.status} for ${page.route}`);
    const validation = parseValidatorResponse(await response.text());
    const types = validation.tripleGroups.map((group) => group.type).sort();
    const result = {
      route: page.route,
      types,
      errors: validation.totalNumErrors,
      warnings: validation.totalNumWarnings,
    };
    results.push(result);

    if (
      result.errors !== 0 ||
      result.warnings !== 0 ||
      !page.expectedTypes.every((type) => types.includes(type))
    ) {
      throw new Error(`Structured-data validation failed:\n${JSON.stringify(result, null, 2)}`);
    }
  }

  process.stdout.write(`${JSON.stringify({
    validator: validatorUrl,
    buildTarget: "production",
    buildDate: "2026-07-17",
    results,
  }, null, 2)}\n`);
} finally {
  await removeLifecycleProject(projectRoot);
}
