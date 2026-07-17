import type {
  EvidenceAuthority,
  EvidenceClaimCategory,
  EvidenceObservation,
  FreshnessWindowDays,
} from "./evidence-types";

type SourceType = EvidenceObservation["sourceType"];

export interface EvidenceAuthorityRule {
  authority: EvidenceAuthority;
  rank: number;
  qualifying: boolean;
}

const freshnessWindows = {
  deal: 7,
  tracking: 7,
  price: 30,
  plan: 30,
  capability: 90,
  integration: 90,
  privacy: 90,
  rights: 90,
  region: 90,
  export: 90,
  general_research: 90,
} as const satisfies Record<EvidenceClaimCategory, FreshnessWindowDays>;

const primaryCategories = {
  official_legal: new Set<EvidenceClaimCategory>(["plan", "privacy", "rights", "region", "general_research"]),
  official_pricing: new Set<EvidenceClaimCategory>(["deal", "tracking", "price", "plan"]),
  official_documentation: new Set<EvidenceClaimCategory>([
    "plan",
    "capability",
    "integration",
    "privacy",
    "rights",
    "region",
    "export",
    "general_research",
  ]),
  official_release_notes: new Set<EvidenceClaimCategory>(["capability", "integration", "export", "general_research"]),
  official_plan_interface: new Set<EvidenceClaimCategory>([
    "deal",
    "tracking",
    "price",
    "plan",
    "capability",
    "integration",
    "region",
    "export",
  ]),
  stackbriefs_test: new Set<EvidenceClaimCategory>(["capability", "integration", "export", "general_research"]),
} as const satisfies Partial<Record<SourceType, ReadonlySet<EvidenceClaimCategory>>>;

const directSourceTypes = new Set<SourceType>(["direct_product_page", "direct_help_page"]);
const editorialSourceTypes = new Set<SourceType>(["stackbriefs_editorial"]);

export function freshnessWindowFor(category: EvidenceClaimCategory) {
  return freshnessWindows[category];
}

export function authorityRuleFor(
  sourceType: SourceType,
  category: EvidenceClaimCategory,
): EvidenceAuthorityRule | undefined {
  const categories = primaryCategories[sourceType as keyof typeof primaryCategories];
  if (categories?.has(category)) return { authority: "primary", rank: 2, qualifying: true };
  if (directSourceTypes.has(sourceType)) return { authority: "direct", rank: 1, qualifying: true };
  if (editorialSourceTypes.has(sourceType)) return { authority: "editorial", rank: 0, qualifying: false };
  return undefined;
}
