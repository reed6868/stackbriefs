import { z } from "astro/zod";

import type { ContentGraph, GraphIssue } from "./graph-types";
import { identifier, isoDate } from "./primitives";

export const publicationHistoryEntrySchema = z
  .object({
    recordType: z.enum(["scenario", "tool"]),
    id: identifier,
    slug: identifier,
    firstPublishedAt: isoDate,
  })
  .strict();

export const publicationHistorySchema = z.array(publicationHistoryEntrySchema).superRefine((entries, context) => {
  const identities = new Set<string>();
  const slugs = new Set<string>();

  entries.forEach((entry, index) => {
    const identity = `${entry.recordType}:${entry.id}`;
    const slug = `${entry.recordType}:${entry.slug}`;
    if (identities.has(identity)) {
      context.addIssue({ code: "custom", path: [index, "id"], message: "publication identity must be unique" });
    }
    if (slugs.has(slug)) {
      context.addIssue({ code: "custom", path: [index, "slug"], message: "published slug must be unique" });
    }
    identities.add(identity);
    slugs.add(slug);
  });
});

export type PublicationHistory = z.infer<typeof publicationHistorySchema>;
export type PublicationHistoryInput = z.input<typeof publicationHistorySchema>;

export function validatePublicationHistoryEvolution(previous: PublicationHistory, current: PublicationHistory) {
  const currentByIdentity = new Map(current.map((entry) => [`${entry.recordType}:${entry.id}`, entry]));

  return previous.flatMap((entry, index): GraphIssue[] => {
    const currentEntry = currentByIdentity.get(`${entry.recordType}:${entry.id}`);
    if (!currentEntry) {
      return [
        {
          path: ["publicationHistory", index, "id"],
          message: `cannot remove or rename published ${entry.recordType} "${entry.id}"`,
        },
      ];
    }
    if (currentEntry.slug !== entry.slug) {
      return [
        {
          path: ["publicationHistory", index, "slug"],
          message: `cannot change published slug "${entry.slug}"`,
        },
      ];
    }
    if (currentEntry.firstPublishedAt !== entry.firstPublishedAt) {
      return [
        {
          path: ["publicationHistory", index, "firstPublishedAt"],
          message: `cannot change immutable firstPublishedAt "${entry.firstPublishedAt}"`,
        },
      ];
    }
    return [];
  });
}

export function validatePublicationHistory(graph: ContentGraph, history: PublicationHistory) {
  const issues: GraphIssue[] = [];
  const records = {
    scenario: new Map(graph.scenarios.map((record) => [record.id, record])),
    tool: new Map(graph.tools.map((record) => [record.id, record])),
  };
  const historyByIdentity = new Map(history.map((entry) => [`${entry.recordType}:${entry.id}`, entry]));
  const historyBySlug = new Map(history.map((entry) => [`${entry.recordType}:${entry.slug}`, entry]));

  for (const [recordType, currentRecords] of Object.entries(records) as Array<
    [keyof typeof records, typeof records.scenario | typeof records.tool]
  >) {
    for (const record of currentRecords.values()) {
      const slugEntry = historyBySlug.get(`${recordType}:${record.slug}`);
      if (slugEntry && slugEntry.id !== record.id) {
        const collection = recordType === "scenario" ? "scenarios" : "tools";
        const index = graph[collection].findIndex((candidate) => candidate.id === record.id);
        issues.push({
          path: [collection, index, "slug"],
          message: `published slug "${record.slug}" remains reserved for ${recordType} "${slugEntry.id}"`,
        });
      }
      if (record.fixture || !record.firstPublishedAt) continue;
      const entry = historyByIdentity.get(`${recordType}:${record.id}`);
      const collection = recordType === "scenario" ? "scenarios" : "tools";
      const index = graph[collection].findIndex((candidate) => candidate.id === record.id);
      if (!entry) {
        issues.push({
          path: [collection, index, "firstPublishedAt"],
          message: "published identity must be recorded in the immutable publication-history ledger",
        });
      } else {
        if (entry.slug !== record.slug) {
          issues.push({ path: [collection, index, "slug"], message: `cannot change published slug "${entry.slug}"` });
        }
        if (entry.firstPublishedAt !== record.firstPublishedAt) {
          issues.push({
            path: [collection, index, "firstPublishedAt"],
            message: `cannot change immutable firstPublishedAt "${entry.firstPublishedAt}"`,
          });
        }
      }
    }
  }

  history.forEach((entry, index) => {
    const current = records[entry.recordType].get(entry.id);
    if (!current) {
      issues.push({
        path: ["publicationHistory", index, "id"],
        message: `published ${entry.recordType} "${entry.id}" must remain present, normally as retired content`,
      });
    } else if (current.firstPublishedAt !== entry.firstPublishedAt) {
      issues.push({
        path: ["publicationHistory", index, "firstPublishedAt"],
        message: `current record must retain immutable firstPublishedAt "${entry.firstPublishedAt}"`,
      });
    }
  });

  return issues;
}
