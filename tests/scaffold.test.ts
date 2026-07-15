import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("application scaffold", () => {
  it("exposes the StackBriefs product promise on the static entry page", async () => {
    const page = await readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8");

    expect(page).toContain("Start with a use case. Narrow the options. Choose with confidence.");
  });
});
