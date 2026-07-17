import type { ContentGraph } from "../content/schema";
import { resolveEvidence } from "./evidence";
import type {
  EvidenceClaim,
  EvidenceResolution,
  GatingClaimReadiness,
} from "./evidence-types";

export interface ResolvedClaimEvidence {
  candidateId: string;
  dimensionId: string;
  claim: EvidenceClaim;
  resolution: EvidenceResolution;
}

export interface ContentEvidenceResolution {
  claims: readonly ResolvedClaimEvidence[];
  gatingClaims: readonly GatingClaimReadiness[];
}

export function evidenceCellKey(candidateId: string, dimensionId: string) {
  return `${candidateId}:${dimensionId}`;
}

export function toGatingClaimReadiness(
  candidateId: string,
  dimensionId: string,
  resolution: EvidenceResolution,
): GatingClaimReadiness {
  if (resolution.state === "verified_fact" || resolution.state === "not_applicable") {
    return { candidateId, dimensionId, state: "current", reason: resolution.explanation };
  }
  if (resolution.state === "needs_recheck") {
    return { candidateId, dimensionId, state: "stale", reason: resolution.explanation };
  }
  return { candidateId, dimensionId, state: "missing", reason: resolution.explanation };
}

export function resolveContentEvidence(
  graph: ContentGraph,
  asOf: string,
): ContentEvidenceResolution {
  const claims = [...graph.candidates]
    .sort((left, right) => left.id.localeCompare(right.id, "en"))
    .flatMap((candidate) =>
      Object.entries(candidate.claimBindings)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([dimensionId, binding]): ResolvedClaimEvidence => {
          const claim = {
            subjectType: binding.subjectType,
            subjectId: binding.subjectType === "candidate" ? candidate.id : candidate.toolId,
            claimKey: binding.claimKey,
            category: binding.evidenceCategory,
            scope: binding.scope,
          } satisfies EvidenceClaim;
          return {
            candidateId: candidate.id,
            dimensionId,
            claim,
            resolution: resolveEvidence({ claim, observations: graph.sources, asOf }),
          };
        }),
    );

  return {
    claims,
    gatingClaims: claims.map(({ candidateId, dimensionId, resolution }) =>
      toGatingClaimReadiness(candidateId, dimensionId, resolution)),
  };
}
