import { z } from "astro/zod";

const idPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const identifier = z
  .string()
  .trim()
  .min(1, "must not be empty")
  .regex(idPattern, "must use lowercase kebab-case");

const nonEmptyText = z.string().trim().min(1, "must not be empty");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year!, month! - 1, day));

    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month! - 1 &&
      parsed.getUTCDate() === day
    );
  }, "must be a valid ISO calendar date (YYYY-MM-DD)");

const httpsUrl = z
  .url("must be a valid URL")
  .refine((value) => new URL(value).protocol === "https:", "must use https");

const uniqueStrings = <T extends z.ZodType<string>>(item: T, message: string) =>
  z.array(item).refine((values) => new Set(values).size === values.length, message);

const fixtureField = z.object({ fixture: z.boolean() }).strict();

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

    if (record.status === "retired" && !record.firstPublishedAt) {
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
    operator: z.literal("eq", {
      error: "boolean dimensions support only the eq operator",
    }),
    order: z.number().int().positive(),
  })
  .strict();

const enumDimensionSchema = z
  .object({
    id: identifier,
    label: nonEmptyText,
    valueType: z.literal("enum"),
    operator: z.literal("eq", {
      error: "enum dimensions support only the eq operator",
    }),
    order: z.number().int().positive(),
    allowedValues: z
      .array(z.object({ value: identifier, label: nonEmptyText }).strict())
      .min(1)
      .refine(
        (values) => new Set(values.map(({ value }) => value)).size === values.length,
        "allowedValues must use unique canonical values",
      ),
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
    allowedValues: z
      .array(z.object({ value: z.number(), label: nonEmptyText }).strict())
      .min(1)
      .refine(
        (values) => new Set(values.map(({ value }) => value)).size === values.length,
        "allowedValues must use unique canonical values",
      ),
    unit: identifier,
  })
  .strict();

const enumSetDimensionSchema = z
  .object({
    id: identifier,
    label: nonEmptyText,
    valueType: z.literal("enum-set"),
    operator: z.literal("contains", {
      error: "enum-set dimensions support only the contains operator",
    }),
    order: z.number().int().positive(),
    allowedValues: z
      .array(z.object({ value: identifier, label: nonEmptyText }).strict())
      .min(1)
      .refine(
        (values) => new Set(values.map(({ value }) => value)).size === values.length,
        "allowedValues must use unique canonical values",
      ),
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
    logo: z
      .object({
        src: nonEmptyText,
        alt: nonEmptyText,
      })
      .strict()
      .optional(),
  })
  .strict();

const claimBindingSchema = z
  .object({
    subjectType: z.enum(["candidate", "tool"]),
    claimKey: identifier,
  })
  .strict();

export const candidateSchema = fixtureField
  .safeExtend({
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

export const sourceSchema = fixtureField
  .safeExtend({
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
      context.addIssue({
        code: "custom",
        path: ["effectiveTo"],
        message: "cannot be earlier than effectiveFrom",
      });
    }
  });

export const sourceObservationSchema = sourceSchema;

export const offerSchema = fixtureField
  .safeExtend({
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

const graphShape = {
  scenarios: z.array(scenarioSchema),
  tools: z.array(toolSchema),
  candidates: z.array(candidateSchema),
  sources: z.array(sourceSchema),
  offers: z.array(offerSchema),
};

function addIssue(
  context: z.RefinementCtx,
  collection: keyof typeof graphShape,
  index: number,
  field: string,
  message: string,
) {
  context.addIssue({ code: "custom", path: [collection, index, field], message });
}

function findDuplicate(values: readonly string[]) {
  const seen = new Set<string>();
  return values.find((value) => (seen.has(value) ? true : !seen.add(value)));
}

function validateObservedValue(
  source: z.infer<typeof sourceSchema>,
  dimension: z.infer<typeof dimensionSchema>,
) {
  if (dimension.valueType === "boolean") {
    return typeof source.observedValue === "boolean"
      ? undefined
      : `must be a boolean for Dimension "${dimension.id}"`;
  }

  if (dimension.valueType === "number") {
    if (typeof source.observedValue !== "number" || !Number.isFinite(source.observedValue)) {
      return `must be a finite number for Dimension "${dimension.id}"`;
    }
    if (source.observedUnit !== dimension.unit) {
      return `must use unit "${dimension.unit}" for Dimension "${dimension.id}"`;
    }
    return undefined;
  }

  if (dimension.valueType === "enum") {
    const allowedValues = dimension.allowedValues.map(({ value }) => value);
    return typeof source.observedValue === "string" && allowedValues.includes(source.observedValue)
      ? undefined
      : `must be one of ${allowedValues.join(", ")} for Dimension "${dimension.id}"`;
  }

  if (!Array.isArray(source.observedValue)) {
    return `must be an array for Dimension "${dimension.id}"`;
  }
  const allowedValues = dimension.allowedValues.map(({ value }) => value);
  const invalid = source.observedValue.find((value) => !allowedValues.includes(value as string));
  return invalid === undefined
    ? undefined
    : `contains non-canonical value "${String(invalid)}" for Dimension "${dimension.id}"`;
}

export const contentGraphSchema = z
  .object(graphShape)
  .strict()
  .superRefine((graph, context) => {
    for (const [collection, records] of Object.entries(graph) as Array<
      [keyof typeof graphShape, Array<{ id: string }>]
    >) {
      const duplicate = findDuplicate(records.map((record) => record.id));
      if (duplicate) {
        const index = records.findIndex((record) => record.id === duplicate);
        addIssue(context, collection, index, "id", `duplicate immutable ID "${duplicate}"`);
      }
    }

    for (const [collection, records] of [
      ["scenarios", graph.scenarios],
      ["tools", graph.tools],
    ] as const) {
      const duplicate = findDuplicate(records.map((record) => record.slug));
      if (duplicate) {
        const index = records.findIndex((record) => record.slug === duplicate);
        addIssue(context, collection, index, "slug", `duplicate immutable slug "${duplicate}"`);
      }
    }

    const scenarios = new Map(graph.scenarios.map((record) => [record.id, record]));
    const tools = new Map(graph.tools.map((record) => [record.id, record]));
    const candidates = new Map(graph.candidates.map((record) => [record.id, record]));
    const sources = new Map(graph.sources.map((record) => [record.id, record]));
    const offers = new Map(graph.offers.map((record) => [record.id, record]));
    const scenarioSlugs = new Map(graph.scenarios.map((record) => [record.slug, record]));
    const toolSlugs = new Map(graph.tools.map((record) => [record.slug, record]));
    const candidatePairs = new Set<string>();

    graph.scenarios.forEach((scenario, scenarioIndex) => {
      if (scenario.replacementSlug) {
        const replacement = scenarioSlugs.get(scenario.replacementSlug);
        if (!replacement || replacement.status !== "published" || replacement.id === scenario.id) {
          addIssue(
            context,
            "scenarios",
            scenarioIndex,
            "replacementSlug",
            `must reference a different published Scenario, received "${scenario.replacementSlug}"`,
          );
        }
      }

      scenario.candidateIds.forEach((candidateId) => {
        const candidate = candidates.get(candidateId);
        if (!candidate) {
          addIssue(
            context,
            "scenarios",
            scenarioIndex,
            "candidateIds",
            `referenced Candidate "${candidateId}" does not exist`,
          );
          return;
        }
        if (candidate.scenarioId !== scenario.id) {
          addIssue(
            context,
            "scenarios",
            scenarioIndex,
            "candidateIds",
            `Candidate "${candidateId}" belongs to Scenario "${candidate.scenarioId}"`,
          );
        }
        if (!scenario.fixture && candidate.fixture) {
          addIssue(
            context,
            "scenarios",
            scenarioIndex,
            "candidateIds",
            `non-fixture Scenario cannot reference fixture Candidate "${candidateId}"`,
          );
        }
      });
    });

    graph.tools.forEach((tool, toolIndex) => {
      if (!tool.replacementSlug) return;
      const replacement = toolSlugs.get(tool.replacementSlug);
      if (!replacement || replacement.status !== "published" || replacement.id === tool.id) {
        addIssue(
          context,
          "tools",
          toolIndex,
          "replacementSlug",
          `must reference a different published Tool, received "${tool.replacementSlug}"`,
        );
      }
    });

    graph.candidates.forEach((candidate, candidateIndex) => {
      const scenario = scenarios.get(candidate.scenarioId);
      const tool = tools.get(candidate.toolId);
      const pair = `${candidate.scenarioId}\u0000${candidate.toolId}`;

      if (!scenario) {
        addIssue(
          context,
          "candidates",
          candidateIndex,
          "scenarioId",
          `referenced Scenario "${candidate.scenarioId}" does not exist`,
        );
      }
      if (scenario && !scenario.candidateIds.includes(candidate.id)) {
        addIssue(
          context,
          "candidates",
          candidateIndex,
          "scenarioId",
          `Scenario "${candidate.scenarioId}" does not list Candidate "${candidate.id}"`,
        );
      }
      if (!tool) {
        addIssue(
          context,
          "candidates",
          candidateIndex,
          "toolId",
          `referenced Tool "${candidate.toolId}" does not exist`,
        );
      }
      if (candidatePairs.has(pair)) {
        addIssue(
          context,
          "candidates",
          candidateIndex,
          "toolId",
          `Scenario/Tool pair "${candidate.scenarioId}/${candidate.toolId}" must be unique`,
        );
      }
      candidatePairs.add(pair);

      if (!candidate.fixture && scenario?.fixture) {
        addIssue(context, "candidates", candidateIndex, "scenarioId", "non-fixture Candidate cannot reference a fixture Scenario");
      }
      if (!candidate.fixture && tool?.fixture) {
        addIssue(context, "candidates", candidateIndex, "toolId", "non-fixture Candidate cannot reference a fixture Tool");
      }

      const dimensions = new Map(scenario?.dimensions.map((dimension) => [dimension.id, dimension]) ?? []);
      Object.keys(candidate.claimBindings).forEach((dimensionId) => {
        if (!dimensions.has(dimensionId)) {
          addIssue(
            context,
            "candidates",
            candidateIndex,
            "claimBindings",
            `dimension "${dimensionId}" does not belong to Scenario "${candidate.scenarioId}"`,
          );
        }
      });
    });

    graph.sources.forEach((source, sourceIndex) => {
      const subject =
        source.subjectType === "candidate"
          ? candidates.get(source.subjectId)
          : source.subjectType === "tool"
            ? tools.get(source.subjectId)
            : offers.get(source.subjectId);

      if (!subject) {
        addIssue(
          context,
          "sources",
          sourceIndex,
          "subjectId",
          `referenced ${source.subjectType} subject "${source.subjectId}" does not exist`,
        );
        return;
      }
      if (!source.fixture && subject.fixture) {
        addIssue(context, "sources", sourceIndex, "subjectId", "non-fixture Source cannot reference a fixture subject");
      }
      if (source.subjectType === "offer") {
        const offer = offers.get(source.subjectId)!;
        if (!offer.evidenceIds.includes(source.id)) {
          addIssue(
            context,
            "sources",
            sourceIndex,
            "claimKey",
            `claim does not resolve because Offer "${offer.id}" does not reference this Source`,
          );
        }
        return;
      }

      const matchingDimensions = graph.candidates.flatMap((candidate) => {
        const matchesSubject =
          source.subjectType === "candidate" ? candidate.id === source.subjectId : candidate.toolId === source.subjectId;
        if (!matchesSubject) return [];

        const scenario = scenarios.get(candidate.scenarioId);
        return Object.entries(candidate.claimBindings).flatMap(([dimensionId, binding]) => {
          if (binding.subjectType !== source.subjectType || binding.claimKey !== source.claimKey) return [];
          const dimension = scenario?.dimensions.find((item) => item.id === dimensionId);
          return dimension ? [dimension] : [];
        });
      });

      if (matchingDimensions.length === 0) {
        addIssue(
          context,
          "sources",
          sourceIndex,
          "claimKey",
          `claim does not resolve through any Scenario Candidate binding`,
        );
        return;
      }
      matchingDimensions.forEach((dimension) => {
        const valueIssue = validateObservedValue(source, dimension);
        if (valueIssue) addIssue(context, "sources", sourceIndex, "observedValue", valueIssue);
      });
    });

    graph.offers.forEach((offer, offerIndex) => {
      const tool = tools.get(offer.toolId);
      if (!tool) {
        addIssue(context, "offers", offerIndex, "toolId", `referenced Tool "${offer.toolId}" does not exist`);
      } else if (!offer.fixture && tool.fixture) {
        addIssue(context, "offers", offerIndex, "toolId", "non-fixture Offer cannot reference a fixture Tool");
      }

      offer.evidenceIds.forEach((evidenceId) => {
        const source = sources.get(evidenceId);
        if (!source) {
          addIssue(context, "offers", offerIndex, "evidenceIds", `referenced Source "${evidenceId}" does not exist`);
        } else if (source.subjectType !== "offer" || source.subjectId !== offer.id) {
          addIssue(
            context,
            "offers",
            offerIndex,
            "evidenceIds",
            `Source "${evidenceId}" must target Offer "${offer.id}"`,
          );
        } else if (!offer.fixture && source.fixture) {
          addIssue(context, "offers", offerIndex, "evidenceIds", "non-fixture Offer cannot reference a fixture Source");
        }
      });
    });
  });

export type ScenarioContent = z.infer<typeof scenarioSchema>;
export type ToolContent = z.infer<typeof toolSchema>;
export type CandidateContent = z.infer<typeof candidateSchema>;
export type SourceContent = z.infer<typeof sourceSchema>;
export type OfferContent = z.infer<typeof offerSchema>;
export type ContentGraph = z.infer<typeof contentGraphSchema>;
export type ContentGraphInput = z.input<typeof contentGraphSchema>;

function formatIssuePath(path: PropertyKey[], input: ContentGraphInput) {
  const [collection, index, ...rest] = path;
  if (
    typeof collection === "string" &&
    collection in input &&
    typeof index === "number" &&
    Array.isArray(input[collection as keyof ContentGraphInput])
  ) {
    const record = input[collection as keyof ContentGraphInput][index] as { id?: string } | undefined;
    const label = record?.id ?? String(index);
    return `${collection}[${label}]${rest.length ? `.${rest.join(".")}` : ""}`;
  }
  return path.join(".");
}

export function parseContentGraph(input: ContentGraphInput): ContentGraph {
  const result = contentGraphSchema.safeParse(input);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `${formatIssuePath(issue.path, input)}: ${issue.message}`)
    .sort()
    .join("\n");
  throw new Error(`Content validation failed:\n${details}`);
}
