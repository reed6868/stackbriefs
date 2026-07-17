import { z } from "astro/zod";

import { formatValidationError } from "./format-errors";
import { graphShape, type ContentGraphInput, type GraphIssue } from "./graph-types";
import {
  publicationHistorySchema,
  type PublicationHistoryInput,
  validatePublicationHistory,
} from "./publication-history";
import { validateReferences } from "./validate-references";

export const contentGraphSchema = z
  .object(graphShape)
  .strict()
  .superRefine((graph, context) => {
    validateReferences(graph).forEach((validationIssue) => {
      context.addIssue({ code: "custom", path: validationIssue.path, message: validationIssue.message });
    });
  });

export type ContentGraph = z.infer<typeof contentGraphSchema>;
export type { ContentGraphInput } from "./graph-types";

export interface ParseContentGraphOptions {
  publicationHistory?: PublicationHistoryInput;
}

export function parseContentGraph(input: ContentGraphInput, options: ParseContentGraphOptions = {}): ContentGraph {
  const graphResult = contentGraphSchema.safeParse(input);
  if (!graphResult.success) {
    throw formatValidationError(graphResult.error.issues, input);
  }

  const historyInput = options.publicationHistory ?? [];
  const historyResult = publicationHistorySchema.safeParse(historyInput);
  if (!historyResult.success) {
    throw formatValidationError(historyResult.error.issues, { ...input, publicationHistory: historyInput });
  }

  const historyIssues: GraphIssue[] = validatePublicationHistory(graphResult.data, historyResult.data);
  if (historyIssues.length > 0) {
    throw formatValidationError(historyIssues, { ...input, publicationHistory: historyInput });
  }
  return graphResult.data;
}
