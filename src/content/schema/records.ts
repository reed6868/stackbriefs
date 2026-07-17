import { z } from "astro/zod";

import {
  canonicalNumberValues,
  canonicalStringValues,
  httpsUrl,
  identifier,
  idPattern,
  isoDate,
  nonEmptyText,
  uniqueStrings,
} from "./primitives";

const routeFieldsSchema = z
  .object({
    fixture: z.boolean(),
    id: identifier,
    slug: identifier,
    status: z.enum(["draft", "published", "retired"]),
    lastReviewedAt: isoDate,
    replacementSlug: identifier.optional(),
    firstPublishedAt: isoDate.optional(),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.replacementSlug && record.status !== "retired") {
      context.addIssue({
        code: "custom",
        path: ["replacementSlug"],
        message: "is allowed only when status is retired",
      });
    }
    if (!record.fixture && record.status === "retired" && !record.firstPublishedAt) {
      context.addIssue({
        code: "custom",
        path: ["firstPublishedAt"],
        message: "is required for a retired record because it was previously published",
      });
    }
    if (!record.fixture && record.status === "published" && !record.firstPublishedAt) {
      context.addIssue({
        code: "custom",
        path: ["firstPublishedAt"],
        message: "is required when non-fixture content is published",
      });
    }
    if (record.fixture && record.firstPublishedAt) {
      context.addIssue({
        code: "custom",
        path: ["firstPublishedAt"],
        message: "is reserved for records promoted to Production and cannot be set on a fixture",
      });
    }
    if (record.firstPublishedAt && record.firstPublishedAt > record.lastReviewedAt) {
      context.addIssue({
        code: "custom",
        path: ["firstPublishedAt"],
        message: "cannot be later than lastReviewedAt",
      });
    }
  });

const booleanDimensionSchema = z
  .object({
    id: identifier,
    label: nonEmptyText,
    valueType: z.literal("boolean"),
    operator: z.literal("eq", { error: "boolean dimensions support only the eq operator" }),
    order: z.number().int().positive(),
  })
  .strict();

const enumDimensionSchema = z
  .object({
    id: identifier,
    label: nonEmptyText,
    valueType: z.literal("enum"),
    operator: z.literal("eq", { error: "enum dimensions support only the eq operator" }),
    order: z.number().int().positive(),
    allowedValues: canonicalStringValues,
  })
  .strict();

const numberDimensionSchema = z
  .object({
    id: identifier,
    label: nonEmptyText,
    valueType: z.literal("number"),
    operator: z.enum(["eq", "lte", "gte"], {
      error: "number dimensions support only eq, lte, or gte operators",
    }),
    order: z.number().int().positive(),
    allowedValues: canonicalNumberValues,
    unit: identifier,
  })
  .strict();

const enumSetDimensionSchema = z
  .object({
    id: identifier,
    label: nonEmptyText,
    valueType: z.literal("enum-set"),
    operator: z.literal("contains", { error: "enum-set dimensions support only the contains operator" }),
    order: z.number().int().positive(),
    allowedValues: canonicalStringValues,
  })
  .strict();

export const dimensionSchema = z.discriminatedUnion("valueType", [
  booleanDimensionSchema,
  enumDimensionSchema,
  numberDimensionSchema,
  enumSetDimensionSchema,
]);

export const scenarioSchema = routeFieldsSchema
  .safeExtend({
    title: nonEmptyText,
    goal: nonEmptyText,
    prerequisites: z.array(nonEmptyText).min(1),
    suitableFor: nonEmptyText,
    notSuitableFor: nonEmptyText,
    dimensions: z.array(dimensionSchema).min(1),
    candidateIds: uniqueStrings(identifier, "candidateIds must be unique").min(1),
    verificationChecklist: z.array(nonEmptyText).min(1),
  })
  .strict()
  .superRefine((scenario, context) => {
    const dimensionIds = scenario.dimensions.map((dimension) => dimension.id);
    const dimensionOrders = scenario.dimensions.map((dimension) => dimension.order);

    if (new Set(dimensionIds).size !== dimensionIds.length) {
      context.addIssue({
        code: "custom",
        path: ["dimensions"],
        message: "dimension IDs must be unique within a Scenario",
      });
    }
    if (new Set(dimensionOrders).size !== dimensionOrders.length) {
      context.addIssue({
        code: "custom",
        path: ["dimensions"],
        message: "dimension order values must be unique within a Scenario",
      });
    }
  });

export const toolSchema = routeFieldsSchema
  .safeExtend({
    name: nonEmptyText,
    summary: nonEmptyText,
    officialUrl: httpsUrl,
    logo: z.object({ src: nonEmptyText, alt: nonEmptyText }).strict().optional(),
  })
  .strict();

const claimBindingSchema = z
  .object({
    subjectType: z.enum(["candidate", "tool"]),
    claimKey: identifier,
  })
  .strict();

export const candidateSchema = z
  .object({
    fixture: z.boolean(),
    id: identifier,
    scenarioId: identifier,
    toolId: identifier,
    limitation: nonEmptyText,
    claimBindings: z.record(identifier, claimBindingSchema),
    handsOnState: z.enum(["tested", "partially_tested", "not_tested", "unavailable"]),
  })
  .strict()
  .superRefine((candidate, context) => {
    if (Object.keys(candidate.claimBindings).some((dimensionId) => !idPattern.test(dimensionId))) {
      context.addIssue({ code: "custom", path: ["claimBindings"], message: "keys must use lowercase kebab-case" });
    }
  });

const sourceScopeSchema = z
  .object({
    plan: nonEmptyText.optional(),
    region: nonEmptyText.optional(),
    platform: nonEmptyText.optional(),
    version: nonEmptyText.optional(),
  })
  .strict()
  .refine((scope) => Object.values(scope).some(Boolean), "must name at least one material scope");

const observedValueSchema = z.union([
  z.boolean(),
  z.string().trim().min(1),
  z.number(),
  uniqueStrings(identifier, "observed set values must be unique").min(1),
]);

export const sourceSchema = z
  .object({
    fixture: z.boolean(),
    id: identifier,
    subjectType: z.enum(["candidate", "tool", "offer"]),
    subjectId: identifier,
    claimKey: identifier,
    sourceType: z.enum([
      "official_legal",
      "official_pricing",
      "official_documentation",
      "official_release_notes",
      "official_plan_interface",
      "direct_product_page",
      "direct_help_page",
      "stackbriefs_test",
      "directory",
      "search_result",
      "social_post",
      "community_report",
      "independent_review",
    ]),
    sourceUrl: httpsUrl,
    observedValue: observedValueSchema,
    observedUnit: identifier.optional(),
    scope: sourceScopeSchema,
    lastCheckedAt: isoDate,
    effectiveFrom: isoDate.optional(),
    effectiveTo: isoDate.optional(),
  })
  .strict()
  .superRefine((source, context) => {
    if (source.effectiveFrom && source.effectiveTo && source.effectiveFrom > source.effectiveTo) {
      context.addIssue({ code: "custom", path: ["effectiveTo"], message: "cannot be earlier than effectiveFrom" });
    }
  });

export const sourceObservationSchema = sourceSchema;

export const offerSchema = z
  .object({
    fixture: z.boolean(),
    id: identifier,
    toolId: identifier,
    affiliateUrl: httpsUrl,
    status: z.enum(["verified_deal", "trackable_offer", "research_only", "expired", "rejected"]),
    lastCheckedAt: isoDate,
    evidenceIds: uniqueStrings(identifier, "evidenceIds must be unique"),
    terms: nonEmptyText.optional(),
    region: nonEmptyText.optional(),
  })
  .strict()
  .superRefine((offer, context) => {
    if (["verified_deal", "trackable_offer"].includes(offer.status) && offer.evidenceIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["evidenceIds"],
        message: `${offer.status} requires at least one evidence record`,
      });
    }
  });

export const trustedPageSchema = z
  .object({
    fixture: z.boolean(),
    title: nonEmptyText,
    description: nonEmptyText,
    status: z.enum(["draft", "published", "retired"]),
    lastReviewedAt: isoDate,
    firstPublishedAt: isoDate.optional(),
  })
  .strict();

export type ScenarioContent = z.infer<typeof scenarioSchema>;
export type ToolContent = z.infer<typeof toolSchema>;
export type CandidateContent = z.infer<typeof candidateSchema>;
export type SourceContent = z.infer<typeof sourceSchema>;
export type OfferContent = z.infer<typeof offerSchema>;
export type DimensionContent = z.infer<typeof dimensionSchema>;
