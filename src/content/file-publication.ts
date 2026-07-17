import { readFile } from "node:fs/promises";

import { assemblePublication } from "../domain/publication";
import type { PublicationOptions } from "../domain/model";
import {
  parseContentGraph,
  publicationHistorySchema,
  type ContentGraphInput,
} from "./schema";

export const publicationContentFiles = [
  new URL("./scenarios/index.json", import.meta.url),
  new URL("./tools/index.json", import.meta.url),
  new URL("./candidates/index.json", import.meta.url),
  new URL("./sources/index.json", import.meta.url),
  new URL("./offers/index.json", import.meta.url),
  new URL("./publication-history.json", import.meta.url),
] as const;

async function readJson(url: URL) {
  return JSON.parse(await readFile(url, "utf8")) as unknown;
}

export async function assembleFilePublication(options: Omit<PublicationOptions, "publicationHistory">) {
  const [scenarios, tools, candidates, sources, offers, publicationHistoryInput] = await Promise.all(
    publicationContentFiles.map(readJson),
  );
  const publicationHistory = publicationHistorySchema.parse(publicationHistoryInput);
  const graph = parseContentGraph({
    scenarios,
    tools,
    candidates,
    sources,
    offers,
  } as ContentGraphInput, { publicationHistory });

  return assemblePublication(graph, {
    ...options,
    publicationHistory,
  });
}
