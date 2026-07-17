import { getCollection } from "astro:content";

import type { ContentGraph } from "./schema";
import { assemblePublication } from "../domain/publication";
import type { PublicationAssembly, PublicationOptions } from "../domain/model";

export async function assembleContentCollections(options: PublicationOptions): Promise<PublicationAssembly> {
  const [scenarios, tools, candidates, sources, offers] = await Promise.all([
    getCollection("scenarios"),
    getCollection("tools"),
    getCollection("candidates"),
    getCollection("sources"),
    getCollection("offers"),
  ]);

  const graph: ContentGraph = {
    scenarios: scenarios.map((entry) => entry.data),
    tools: tools.map((entry) => entry.data),
    candidates: candidates.map((entry) => entry.data),
    sources: sources.map((entry) => entry.data),
    offers: offers.map((entry) => entry.data),
  };
  return assemblePublication(graph, options);
}
