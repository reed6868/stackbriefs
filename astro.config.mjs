import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { lifecycleRedirects } from "./src/integrations/lifecycle-redirects";

export default defineConfig({
  site: "https://stackbriefs.pages.dev",
  trailingSlash: "never",
  output: "static",
  build: {
    format: "file",
  },
  integrations: [mdx(), lifecycleRedirects()],
  vite: {
    plugins: [tailwindcss()],
  },
});
