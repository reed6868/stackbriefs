import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://stackbriefs.pages.dev",
  trailingSlash: "never",
  output: "static",
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
