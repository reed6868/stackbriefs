import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { resolveBuildTarget } from "./src/content/build-target";
import { assembleFilePublication } from "./src/content/file-publication";
import { lifecycleRedirects } from "./src/integrations/lifecycle-redirects";

const target = resolveBuildTarget(process.env.STACKBRIEFS_BUILD_TARGET);
const publication = target === "production"
  ? await assembleFilePublication({
      target,
      asOf: process.env.STACKBRIEFS_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
    })
  : undefined;
const sitemapPaths = new Set([
  "/",
  "/methodology",
  "/affiliate-disclosure",
  ...(publication?.publicInputs.sitemapPaths ?? []),
]);
const sitemapIntegration = target === "production"
  ? sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return sitemapPaths.has(path === "/" ? path : path.replace(/\/+$/, ""));
      },
    })
  : undefined;

export default defineConfig({
  site: "https://stackbriefs.pages.dev",
  trailingSlash: "never",
  output: "static",
  build: {
    format: "file",
  },
  integrations: [mdx(), lifecycleRedirects(), ...(sitemapIntegration ? [sitemapIntegration] : [])],
  vite: {
    plugins: [tailwindcss()],
  },
});
