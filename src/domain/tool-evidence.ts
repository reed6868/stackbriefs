import type { DimensionContent, OfferContent, SourceContent } from "../content/schema";
import { relevantCheckDate } from "./content-evidence";
import { downgradeEvidenceForBrowser, resolveEvidence } from "./evidence";
import type { EvidenceResolution } from "./evidence-types";
import { addDaysToIsoDate, earlierIsoDate } from "./iso-date";
import type { DomainCandidate, DomainOffer } from "./model";

export interface ToolEvidenceSource {
  id: string;
  sourceType: SourceContent["sourceType"];
  sourceUrl: string;
  lastCheckedAt: string;
  scope: SourceContent["scope"];
}

export interface ToolClaimProjection {
  dimensionId: string;
  label: string;
  dimension: DimensionContent;
  scope: SourceContent["scope"];
  evidence: EvidenceResolution;
  lastCheckedAt?: string | undefined;
  sources: readonly ToolEvidenceSource[];
}

export interface ToolOfferProjection {
  id: string;
  status: "verified_deal" | "trackable_offer";
  statusLabel: string;
  affiliateUrl: string;
  terms?: string | undefined;
  region?: string | undefined;
  lastCheckedAt: string;
  validThrough: string;
  evidence: EvidenceResolution;
  sources: readonly ToolEvidenceSource[];
}

function projectSources(sources: readonly SourceContent[], sourceIds: readonly string[]) {
  const selectedSourceIds = new Set(sourceIds);
  return sources
    .filter((source) => selectedSourceIds.has(source.id))
    .map((source): ToolEvidenceSource => ({
      id: source.id,
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
      lastCheckedAt: source.lastCheckedAt,
      scope: source.scope,
    }));
}

export function projectToolClaims(candidate: DomainCandidate): readonly ToolClaimProjection[] {
  return [...candidate.claims]
    .sort((left, right) => left.dimension.order - right.dimension.order)
    .map((claim) => ({
      dimensionId: claim.dimensionId,
      label: claim.dimension.label,
      dimension: claim.dimension,
      scope: claim.scope,
      evidence: claim.evidence,
      lastCheckedAt: relevantCheckDate(claim),
      sources: projectSources(claim.sources, claim.evidence.sourceIds),
    }));
}

const qualifyingOfferCategories = {
  verified_deal: "deal",
  trackable_offer: "tracking",
} as const;

const offerStatusLabels = {
  verified_deal: "Verified deal",
  trackable_offer: "Trackable affiliate offer",
} as const;

function qualifyingStatus(status: OfferContent["status"]): status is ToolOfferProjection["status"] {
  return status === "verified_deal" || status === "trackable_offer";
}

export function projectToolOffer(
  offers: readonly DomainOffer[],
  toolId: string,
  asOf: string,
): ToolOfferProjection | undefined {
  const candidates = offers.filter((offer) => offer.toolId === toolId && qualifyingStatus(offer.status));
  for (const offer of candidates) {
    if (!qualifyingStatus(offer.status) || offer.lastCheckedAt > asOf) continue;
    const offerValidThrough = addDaysToIsoDate(offer.lastCheckedAt, 7);
    if (asOf > offerValidThrough) continue;

    const statusSources = offer.evidence
      .filter((source) =>
        source.claimKey === "status" &&
        source.assertion !== "not_applicable" &&
        source.observedValue === offer.status &&
        (offer.region === undefined || source.scope.region === offer.region))
      .sort((left, right) => left.id.localeCompare(right.id, "en"));

    for (const statusSource of statusSources) {
      const evidence = resolveEvidence({
        claim: {
          subjectType: "offer",
          subjectId: offer.id,
          claimKey: "status",
          category: qualifyingOfferCategories[offer.status],
          scope: statusSource.scope,
        },
        observations: offer.evidence,
        asOf,
      });
      if (evidence.state !== "verified_fact" || evidence.value !== offer.status || !evidence.validThrough) continue;

      return {
        id: offer.id,
        status: offer.status,
        statusLabel: offerStatusLabels[offer.status],
        affiliateUrl: offer.affiliateUrl,
        terms: offer.terms,
        region: offer.region,
        lastCheckedAt: offer.lastCheckedAt,
        validThrough: earlierIsoDate(offerValidThrough, evidence.validThrough),
        evidence,
        sources: projectSources(offer.evidence, evidence.sourceIds),
      };
    }
  }

  return undefined;
}

export function downgradeToolClaimForBrowser(
  claim: ToolClaimProjection,
  browserAsOf: string,
): ToolClaimProjection {
  return {
    ...claim,
    evidence: downgradeEvidenceForBrowser(claim.evidence, browserAsOf),
  };
}

export function downgradeToolOfferForBrowser(
  offer: ToolOfferProjection | undefined,
  browserAsOf: string,
): ToolOfferProjection | undefined {
  if (!offer || browserAsOf > offer.validThrough) return undefined;
  const evidence = downgradeEvidenceForBrowser(offer.evidence, browserAsOf);
  return evidence.state === "verified_fact" && evidence.value === offer.status
    ? { ...offer, evidence }
    : undefined;
}
