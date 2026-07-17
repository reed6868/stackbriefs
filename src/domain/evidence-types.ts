import type { EvidenceCategory, SourceContent } from "../content/schema";

export type EvidenceObservation = SourceContent;
export type EvidenceState =
  | "verified_fact"
  | "editorial_assessment"
  | "not_verified"
  | "needs_recheck"
  | "not_applicable"
  | "conflicting";
export type EvidenceClaimCategory = EvidenceCategory;
export type EvidenceAuthority = "primary" | "direct" | "editorial";
export type EvidenceValue = boolean | string | number | readonly string[];
export type FreshnessWindowDays = 7 | 30 | 90;

export interface EvidenceClaim {
  subjectType: EvidenceObservation["subjectType"];
  subjectId: string;
  claimKey: string;
  category: EvidenceClaimCategory;
  scope: EvidenceObservation["scope"];
}

export interface EvidenceResolution {
  state: EvidenceState;
  value?: EvidenceValue | undefined;
  authority?: EvidenceAuthority | undefined;
  sourceIds: readonly string[];
  freshnessWindowDays: FreshnessWindowDays;
  resolvedAt: string;
  validThrough?: string | undefined;
  explanation: string;
}

export interface GatingClaimReadiness {
  candidateId: string;
  dimensionId: string;
  state: "current" | "stale" | "missing";
  reason: string;
}

export interface ResolveEvidenceInput {
  claim: EvidenceClaim;
  observations: readonly EvidenceObservation[];
  asOf: string;
}
