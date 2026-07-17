import { z } from "astro/zod";

import { candidateSchema, offerSchema, scenarioSchema, sourceSchema, toolSchema } from "./records";

export const graphShape = {
  scenarios: z.array(scenarioSchema),
  tools: z.array(toolSchema),
  candidates: z.array(candidateSchema),
  sources: z.array(sourceSchema),
  offers: z.array(offerSchema),
};

export type ContentGraph = {
  [Key in keyof typeof graphShape]: z.infer<(typeof graphShape)[Key]>;
};

export type ContentGraphInput = {
  [Key in keyof typeof graphShape]: z.input<(typeof graphShape)[Key]>;
};

export type GraphCollection = keyof typeof graphShape;

export interface GraphIssue {
  path: PropertyKey[];
  message: string;
}

export function issue(collection: GraphCollection, index: number, field: string, message: string): GraphIssue {
  return { path: [collection, index, field], message };
}
