import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const outputRoot = resolve(root, process.argv[2] ?? "dist");
const evidencePath = resolve(root, process.argv[3] ?? "docs/validation/sb-405-security-headers.json");

const expectedHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
} as const;

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return files.flat();
}

function parseHeaders(source: string) {
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== "/*") throw new Error("Security headers must apply to the /* route pattern");
  return Object.fromEntries(lines.slice(1).flatMap((line) => {
    const match = line.match(/^\s{2}([^:]+):\s*(.+)$/);
    return match ? [[match[1]!, match[2]!.trim()]] : [];
  }));
}

function parseCsp(source: string) {
  return Object.fromEntries(source.split(";").map((directive) => directive.trim()).filter(Boolean).map((directive) => {
    const [name, ...values] = directive.split(/\s+/);
    return [name!, values];
  }));
}

function localResource(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

const files = await filesUnder(outputRoot);
const htmlFiles = files.filter((path) => path.endsWith(".html"));
const cssFiles = files.filter((path) => path.endsWith(".css"));
const jsFiles = files.filter((path) => path.endsWith(".js"));
const headersSource = await readFile(join(outputRoot, "_headers"), "utf8");
const headers = parseHeaders(headersSource);

for (const [name, expected] of Object.entries(expectedHeaders)) {
  if (headers[name] !== expected) throw new Error(`${name} does not match the approved SB-405 policy`);
}
if (Object.keys(headers).length !== Object.keys(expectedHeaders).length) {
  throw new Error("The /* policy contains unreviewed additional headers");
}

const csp = parseCsp(headers["Content-Security-Policy"]!);
const disallowedCspSources = Object.values(csp).flat().filter((value) =>
  value === "'unsafe-inline'" || value === "'unsafe-eval'" || /^https?:/.test(value),
);
if (disallowedCspSources.length > 0) throw new Error(`CSP contains unapproved sources: ${disallowedCspSources}`);

const scriptAssets = new Set<string>();
const stylesheetAssets = new Set<string>();
const imageAssets = new Set<string>();
const manifestAssets = new Set<string>();
const fontReferences = new Set<string>();
const unapprovedResourceUrls: string[] = [];
let inlineExecutableScripts = 0;

for (const path of htmlFiles) {
  const source = await readFile(path, "utf8");
  for (const match of source.matchAll(/<script\b([^>]*)>/gi)) {
    const attributes = match[1] ?? "";
    const src = attributes.match(/\bsrc="([^"]+)"/i)?.[1];
    if (src) {
      scriptAssets.add(src);
      if (!localResource(src)) unapprovedResourceUrls.push(src);
    } else if (!/\btype="application\/ld\+json"/i.test(attributes)) {
      inlineExecutableScripts += 1;
    }
  }
  for (const match of source.matchAll(/<link\b([^>]*)>/gi)) {
    const attributes = match[1] ?? "";
    const href = attributes.match(/\bhref="([^"]+)"/i)?.[1];
    const rel = attributes.match(/\brel="([^"]+)"/i)?.[1] ?? "";
    if (!href) continue;
    if (/\bstylesheet\b/i.test(rel)) stylesheetAssets.add(href);
    if (/\bmanifest\b/i.test(rel)) manifestAssets.add(href);
    if (/\b(?:stylesheet|preload|icon|manifest)\b/i.test(rel) && !localResource(href)) {
      unapprovedResourceUrls.push(href);
    }
  }
  for (const match of source.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
    const src = match[1]!;
    imageAssets.add(src);
    if (!localResource(src)) unapprovedResourceUrls.push(src);
  }
}

for (const path of cssFiles) {
  const source = await readFile(path, "utf8");
  for (const match of source.matchAll(/url\((?:"|')?([^"')]+)(?:"|')?\)/gi)) {
    const value = match[1]!.trim();
    fontReferences.add(value);
    if (!localResource(value)) unapprovedResourceUrls.push(value);
  }
}

let unapprovedRuntimeConnections = 0;
for (const path of jsFiles) {
  const source = await readFile(path, "utf8");
  if (/\b(?:fetch|WebSocket|EventSource|XMLHttpRequest)\s*\(|\.sendBeacon\s*\(/.test(source)) {
    unapprovedRuntimeConnections += 1;
  }
}

if (inlineExecutableScripts > 0) throw new Error(`Built output contains ${inlineExecutableScripts} inline executable scripts`);
if (unapprovedResourceUrls.length > 0) {
  throw new Error(`Built output contains unapproved resource URLs: ${[...new Set(unapprovedResourceUrls)].join(", ")}`);
}
if (unapprovedRuntimeConnections > 0) {
  throw new Error(`Built output contains runtime connection APIs in ${unapprovedRuntimeConnections} scripts`);
}

const evidence = {
  task: "SB-405",
  artifact: relative(root, join(outputRoot, "_headers")),
  routePattern: "/*",
  headers: expectedHeaders,
  cspDirectives: csp,
  validatedOutput: {
    htmlFiles: htmlFiles.length,
    scriptAssets: [...scriptAssets].sort(),
    stylesheetAssets: [...stylesheetAssets].sort(),
    imageAssets: [...imageAssets].sort(),
    manifestAssets: [...manifestAssets].sort(),
    fontReferences: [...fontReferences].sort(),
    inlineExecutableScripts,
    unapprovedResourceUrls: 0,
    unapprovedRuntimeConnections,
  },
  result: { errors: 0, warnings: 0 },
};

await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`Validated ${htmlFiles.length} HTML files against ${relative(root, join(outputRoot, "_headers"))}`);
console.log(`Wrote ${relative(root, evidencePath)} with zero errors and warnings`);
