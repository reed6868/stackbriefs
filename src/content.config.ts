import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";

import {
  candidateSchema,
  offerSchema,
  scenarioSchema,
  sourceSchema,
  toolSchema,
  trustedPageSchema,
} from "./content/schema";

const scenarios = defineCollection({
  loader: file("src/content/scenarios/index.json"),
  schema: scenarioSchema,
});

const tools = defineCollection({
  loader: file("src/content/tools/index.json"),
  schema: toolSchema,
});

const candidates = defineCollection({
  loader: file("src/content/candidates/index.json"),
  schema: candidateSchema,
});

const sources = defineCollection({
  loader: file("src/content/sources/index.json"),
  schema: sourceSchema,
});

const offers = defineCollection({
  loader: file("src/content/offers/index.json"),
  schema: offerSchema,
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
  schema: trustedPageSchema,
});

export const collections = { scenarios, tools, candidates, sources, offers, pages };
