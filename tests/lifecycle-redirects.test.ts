import { describe, expect, it } from "vitest";

import {
  assertLifecycleReplacementsValid,
  renderCloudflareRedirects,
} from "../src/integrations/lifecycle-redirects";

describe("lifecycle redirect output", () => {
  it("preserves static rules and appends stable deduplicated permanent redirects", () => {
    expect(renderCloudflareRedirects(
      "/decision /#scenarios 301\n/decision/old /decision/current 301\n",
      [
        { from: "/tool/old", to: "/tool/current", statusCode: 301 },
        { from: "/decision/old", to: "/decision/current", statusCode: 301 },
      ],
    )).toBe([
      "/decision /#scenarios 301",
      "/decision/old /decision/current 301",
      "/tool/old /tool/current 301",
      "",
    ].join("\n"));
  });

  it("rejects invalid replacement issues before redirect configuration", () => {
    expect(() => assertLifecycleReplacementsValid({
      issues: [{
        code: "invalid_replacement",
        path: "scenarios[scenario-retired].replacementSlug",
        message: 'replacement "missing-scenario" does not exist',
      }],
    })).toThrow(
      'Lifecycle replacement validation failed:\nscenarios[scenario-retired].replacementSlug: replacement "missing-scenario" does not exist',
    );
  });
});
