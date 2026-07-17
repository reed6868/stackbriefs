import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("Production publication build", () => {
  it("excludes fixture discovery, Decision routes, Tool routes, sitemap inputs, and structured-data inputs", async () => {
    const output = await mkdtemp(join(tmpdir(), "stackbriefs-production-"));
    const root = fileURLToPath(new URL("..", import.meta.url));

    try {
      await execFileAsync("npx", ["astro", "build", "--outDir", output], {
        cwd: root,
        env: {
          ...process.env,
          STACKBRIEFS_BUILD_TARGET: "production",
          STACKBRIEFS_BUILD_DATE: "2026-07-17",
        },
      });

      const [home, methodology, disclosure, headers] = await Promise.all([
        readFile(join(output, "index.html"), "utf8"),
        readFile(join(output, "methodology.html"), "utf8"),
        readFile(join(output, "affiliate-disclosure.html"), "utf8"),
        readFile(join(output, "_headers"), "utf8"),
      ]);
      expect(home).not.toContain("/decision/meeting-assistants");
      expect(home).not.toContain("/decision/writing-assistants");
      expect(home).not.toContain('data-fixture="true"');
      expect(methodology).toContain('href="/#scenarios"');
      expect(methodology).toContain('href="/affiliate-disclosure"');
      expect(methodology).not.toContain('href="/decision/');
      expect(disclosure).toContain("Official Link");
      expect(disclosure).toContain("Evidence Link");
      expect(disclosure).toContain("Offer Link");
      expect(disclosure).not.toContain('data-fixture="true"');
      expect(disclosure).not.toMatch(/placeholder|final content arrives later/i);
      expect(headers).toContain("/*");
      expect(headers).toContain("Content-Security-Policy: default-src 'self'");
      expect(headers).toContain("script-src 'self'");
      expect(headers).toContain("style-src 'self'");
      expect(headers).toContain("img-src 'self'");
      expect(headers).toContain("font-src 'self'");
      expect(headers).toContain("connect-src 'none'");
      expect(headers).toContain("object-src 'none'");
      expect(headers).toContain("base-uri 'none'");
      expect(headers).toContain("frame-ancestors 'none'");
      expect(headers).toContain("form-action 'self'");
      expect(headers).not.toMatch(/unsafe-inline|unsafe-eval|https?:\/\//);
      expect(headers).toContain("Referrer-Policy: strict-origin-when-cross-origin");
      expect(headers).toContain("X-Content-Type-Options: nosniff");
      expect(headers).toContain(
        "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      );
      for (const html of [home, methodology, disclosure]) {
        expect(html).not.toMatch(/<script(?![^>]+type="application\/ld\+json")(?![^>]+src="\/)/);
        expect(html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="(?!\/)/);
      }
      await expect(access(join(output, "decision"))).rejects.toThrow();
      await expect(access(join(output, "tool"))).rejects.toThrow();
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  }, 30_000);
});
