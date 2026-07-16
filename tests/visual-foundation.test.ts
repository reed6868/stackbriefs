import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const expectedColors = {
  "color-canvas": "#f7f8fa",
  "color-surface": "#ffffff",
  "color-text": "#171a21",
  "color-muted": "#4f5868",
  "color-border": "#d8dee8",
  "color-brand": "#2346c9",
  "color-brand-soft": "#eef2ff",
  "color-success": "#1b6b45",
  "color-warning": "#8a4b08",
  "color-danger": "#b42318",
} as const;

const contrastPairs = [
  ["text on canvas", "color-text", "color-canvas"],
  ["muted text on canvas", "color-muted", "color-canvas"],
  ["brand on surface", "color-brand", "color-surface"],
  ["brand on brand-soft", "color-brand", "color-brand-soft"],
  ["success on surface", "color-success", "color-surface"],
  ["warning on surface", "color-warning", "color-surface"],
  ["danger on surface", "color-danger", "color-surface"],
] as const;

function parseTokens(css: string) {
  return Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*([^;]+);/g)]
      .reverse()
      .map((match) => [match[1]!, match[2]!.trim().toLowerCase()]),
  ) as Record<string, string>;
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));

  return (light + 0.05) / (dark + 0.05);
}

describe("visual foundation", () => {
  it("defines the approved color tokens with AA contrast for normal text", async () => {
    const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
    const tokens = parseTokens(css);

    expect(tokens).toMatchObject(expectedColors);

    for (const [label, foreground, background] of contrastPairs) {
      const ratio = contrastRatio(tokens[foreground]!, tokens[background]!);

      expect(ratio, `${label} contrast is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("defines the minimum typography, spacing, shape, motion, container, and layer contracts", async () => {
    const css = await readFile(new URL("../src/styles/global.css", import.meta.url), "utf8");
    const tokens = parseTokens(css);

    expect(tokens).toMatchObject({
      "font-sans": '"geist", ui-sans-serif, system-ui, sans-serif',
      "font-mono": '"geist mono", ui-monospace, "sfmono-regular", consolas, monospace',
      "text-meta": "0.875rem",
      "text-body": "1rem",
      "text-heading-sm": "1.25rem",
      "text-heading-md": "1.5rem",
      "text-heading-lg": "2rem",
      "text-heading-xl": "2.75rem",
      "space-1": "0.25rem",
      "space-2": "0.5rem",
      "space-4": "1rem",
      "radius-control": "0.5rem",
      "radius-panel": "0.75rem",
      "border-width": "1px",
      "shadow-elevated": "0 0.75rem 2rem rgb(23 26 33 / 0.12)",
      "motion-fast": "120ms",
      "motion-standard": "180ms",
      "container-reading": "72ch",
      "container-wide": "75rem",
      "layer-sticky": "10",
      "layer-dock": "20",
      "layer-overlay": "30",
      "page-gutter": "1rem",
    });

    expect(css).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*--page-gutter:\s*1\.5rem/);
    expect(css).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*--page-gutter:\s*2rem/);
    expect(css).toMatch(/:focus-visible[\s\S]*outline:\s*3px solid var\(--color-brand\)/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/\.state-label\[data-state="success"\]::before\s*{[\s\S]*content:\s*"✓"/);
    expect(css).toMatch(/\.state-label\[data-state="warning"\]::before\s*{[\s\S]*content:\s*"!"/);
    expect(css).toMatch(/\.state-label\[data-state="danger"\]::before\s*{[\s\S]*content:\s*"×"/);
    expect(css).not.toContain("#f7f3ea");
    expect(css).not.toContain("#9a4d2d");
  });

  it("renders local identity and self-hosted font assets from the base layout", async () => {
    const [layout, page, css, manifest, font, monoFont, logo, favicon] = await Promise.all([
      readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8"),
      readFile(new URL("../src/styles/global.css", import.meta.url), "utf8"),
      readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8"),
      readFile(new URL("../public/fonts/geist-latin.woff2", import.meta.url)),
      readFile(new URL("../public/fonts/geist-mono-latin.woff2", import.meta.url)),
      readFile(new URL("../src/assets/stackbriefs-mark.svg", import.meta.url), "utf8"),
      readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
    ]);
    const parsedManifest = JSON.parse(manifest) as {
      name: string;
      background_color: string;
      theme_color: string;
      icons: Array<{ src: string; type: string; sizes: string }>;
    };

    expect(layout).toContain('href="/favicon.svg"');
    expect(layout).toContain('href="/favicon.ico"');
    expect(layout).toContain('href="/site.webmanifest"');
    expect(layout).toContain('href="/fonts/geist-latin.woff2"');
    expect(layout).toContain('name="theme-color" content="#F7F8FA"');
    expect(page).toContain('class="site-container"');
    expect(page).toContain("stackbriefsMark.src");
    expect(css).toContain('src: url("/fonts/geist-latin.woff2") format("woff2");');
    expect(css).toContain('src: url("/fonts/geist-mono-latin.woff2") format("woff2");');
    expect(css).toContain("font-display: swap;");
    expect(parsedManifest).toMatchObject({
      name: "StackBriefs",
      background_color: "#F7F8FA",
      theme_color: "#F7F8FA",
    });
    expect(parsedManifest.icons).toContainEqual({
      src: "/favicon.svg",
      type: "image/svg+xml",
      sizes: "any",
    });
    expect(font.subarray(0, 4).toString("ascii")).toBe("wOF2");
    expect(monoFont.subarray(0, 4).toString("ascii")).toBe("wOF2");
    expect(logo).toContain("StackBriefs S Mark");
    for (const asset of [logo, favicon]) {
      expect(asset.toLowerCase()).toContain("#2346c9");
    }
  });
});
