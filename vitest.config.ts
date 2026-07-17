/// <reference types="vitest/config" />

import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    exclude: [".worktrees/**", "tests/browser/**", "node_modules/**", "dist/**"],
  },
});
