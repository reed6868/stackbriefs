import { readFile, readdir } from "node:fs/promises";

import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";

import { trustedMdxPolicy } from "../src/content/trusted-mdx-policy";

async function compileTrustedMdx(source: string) {
  return compile(source, { remarkPlugins: [trustedMdxPolicy] });
}

async function sourceFiles(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));
  return files.flat().filter((path) => /\.(?:astro|ts)$/.test(path.pathname));
}

describe("trusted authored content policy", () => {
  it("accepts the checked-in trusted pages and the narrow mailto exception", async () => {
    const [methodology, disclosure] = await Promise.all([
      readFile(new URL("../src/content/pages/methodology.mdx", import.meta.url), "utf8"),
      readFile(new URL("../src/content/pages/affiliate-disclosure.mdx", import.meta.url), "utf8"),
    ]);

    await expect(compileTrustedMdx(methodology)).resolves.toBeDefined();
    await expect(compileTrustedMdx(disclosure)).resolves.toBeDefined();
    await expect(compileTrustedMdx("Contact [the editorial team](mailto:editor@example.com)."))
      .resolves.toBeDefined();
    await expect(compileTrustedMdx(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Approved source</a>',
    )).resolves.toBeDefined();
  });

  it.each([
    ["imports", "import Widget from './widget.astro'\n\nSafe copy."],
    ["exports", "export const unsafe = true\n\nSafe copy."],
    ["arbitrary components", "<Widget />"],
    ["inline scripts", "<script>alert('unsafe')</script>"],
    ["event handlers", "<button onclick=\"alert('unsafe')\">Run</button>"],
    ["raw HTML directives", "<div set:html=\"unsafe\"></div>"],
    ["inline directives", "<script is:inline>unsafe</script>"],
    ["MDX expressions", "Unsafe {globalThis.location} expression."],
    ["unsafe Markdown URLs", "[unsafe](javascript:alert(1))"],
    ["insecure outbound URLs", "[unsafe](http://example.com)"],
    ["protocol-relative URLs", "[unsafe](//example.com/path)"],
    ["remote images", "![tracking pixel](https://example.com/pixel.png)"],
    ["external form actions", "<form action=\"https://example.com/collect\"></form>"],
    ["new tabs without opener protection", '<a href="https://example.com" target="_blank">Unsafe</a>'],
    ["explicit opener relationships", '<a href="https://example.com" target="_blank" rel="opener">Unsafe</a>'],
  ])("rejects %s", async (_label, source) => {
    await expect(compileTrustedMdx(source)).rejects.toThrow(/trusted MDX/i);
  });

  it("is wired into the Astro MDX build boundary", async () => {
    const config = await readFile(new URL("../astro.config.mjs", import.meta.url), "utf8");

    expect(config).toContain('import { unified } from "@astrojs/markdown-remark"');
    expect(config).toContain('import { trustedMdxPolicy } from "./src/content/trusted-mdx-policy"');
    expect(config).toMatch(/markdown:\s*\{\s*processor:\s*unified\(\{ remarkPlugins:\s*\[trustedMdxPolicy\]/);
    expect(config).toContain("mdx()");
  });

  it("keeps raw HTML sinks limited to escaped structured data", async () => {
    const files = await sourceFiles(new URL("../src/", import.meta.url));
    const sources = await Promise.all(files.map(async (path) => ({
      path,
      source: await readFile(path, "utf8"),
    })));
    const rawSinks = sources.flatMap(({ path, source }) =>
      [...source.matchAll(/set:html|\bis:inline\b|\.innerHTML\b|insertAdjacentHTML|\.outerHTML\b/g)]
        .map((match) => ({ file: path.pathname, sink: match[0] })),
    );
    const layout = sources.find(({ path }) => path.pathname.endsWith("/src/layouts/BaseLayout.astro"))?.source ?? "";

    expect(rawSinks).toEqual([
      { file: expect.stringMatching(/\/src\/layouts\/BaseLayout\.astro$/), sink: "is:inline" },
      { file: expect.stringMatching(/\/src\/layouts\/BaseLayout\.astro$/), sink: "set:html" },
    ]);
    expect(layout).toContain("set:html={serializedStructuredData}");
    expect(layout).toContain("serializeStructuredData");
  });
});
