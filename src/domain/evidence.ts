import { authorityRuleFor, freshnessWindowFor } from "./evidence-policy";
import type {
  EvidenceAuthority,
  EvidenceClaim,
  EvidenceObservation,
  EvidenceResolution,
  EvidenceValue,
  FreshnessWindowDays,
  ResolveEvidenceInput,
} from "./evidence-types";
import { addDaysToIsoDate, assertIsoDate, earlierIsoDate, latestIsoDate } from "./iso-date";
import type { DomainScenario } from "./model";

export type {
  EvidenceAuthority,
  EvidenceClaim,
  EvidenceClaimCategory,
  EvidenceObservation,
  EvidenceResolution,
  EvidenceState,
  EvidenceValue,
  FreshnessWindowDays,
  ResolveEvidenceInput,
} from "./evidence-types";

interface ClassifiedObservation {
  observation: EvidenceObservation;
  authority: EvidenceAuthority;
  rank: number;
  qualifying: boolean;
  current: boolean;
  validThrough: string;
  valueKey: string;
  value?: EvidenceValue | undefined;
}

const scopeKeys = ["plan", "region", "platform", "version"] as const;

function scopeMatches(expected: EvidenceClaim["scope"], actual: EvidenceObservation["scope"]) {
  return scopeKeys.every((key) => expected[key] === actual[key]);
}

function canonicalValue(value: EvidenceValue): EvidenceValue {
  return Array.isArray(value) ? [...value].sort((left, right) => left.localeCompare(right, "en")) : value;
}

function valueKey(observation: EvidenceObservation) {
  if (observation.assertion === "not_applicable") {
    return { key: "not_applicable", value: undefined };
  }
  const value = canonicalValue(observation.observedValue);
  return { key: `value:${JSON.stringify(value)}`, value };
}

function sourceIds(observations: readonly ClassifiedObservation[]) {
  return observations.map(({ observation }) => observation.id).sort((left, right) => left.localeCompare(right, "en"));
}

function groupByValue(observations: readonly ClassifiedObservation[]) {
  const byValue = new Map<string, ClassifiedObservation[]>();
  observations.forEach((observation) => {
    byValue.set(observation.valueKey, [...(byValue.get(observation.valueKey) ?? []), observation]);
  });
  return byValue;
}

function validThroughForResolution(observations: readonly ClassifiedObservation[]) {
  const groupExpiries = [...groupByValue(observations).values()].map((group) =>
    latestIsoDate(group.map(({ validThrough }) => validThrough)));
  return groupExpiries.length === 1 ? groupExpiries[0]! : [...groupExpiries].sort()[0]!;
}

function resolveCurrent(
  claim: EvidenceClaim,
  observations: readonly ClassifiedObservation[],
  freshnessWindowDays: FreshnessWindowDays,
  asOf: string,
): EvidenceResolution {
  const byValue = groupByValue(observations);
  const authority = observations[0]!.authority;
  const qualifying = observations[0]!.qualifying;
  const selectedSourceIds = sourceIds(observations);
  const validThrough = validThroughForResolution(observations);

  if (byValue.size > 1) {
    return {
      state: "conflicting",
      authority,
      sourceIds: selectedSourceIds,
      freshnessWindowDays,
      resolvedAt: asOf,
      validThrough,
      explanation: `Current equal-authority evidence conflicts for claim "${claim.claimKey}"`,
    };
  }

  const first = observations[0]!;
  if (!qualifying) {
    return {
      state: "editorial_assessment",
      value: first.value,
      authority,
      sourceIds: selectedSourceIds,
      freshnessWindowDays,
      resolvedAt: asOf,
      validThrough,
      explanation: `Only current non-qualifying evidence supports claim "${claim.claimKey}"`,
    };
  }
  if (first.valueKey === "not_applicable") {
    return {
      state: "not_applicable",
      authority,
      sourceIds: selectedSourceIds,
      freshnessWindowDays,
      resolvedAt: asOf,
      validThrough,
      explanation: `Current qualifying evidence explicitly marks claim "${claim.claimKey}" not applicable`,
    };
  }
  return {
    state: "verified_fact",
    value: first.value,
    authority,
    sourceIds: selectedSourceIds,
    freshnessWindowDays,
    resolvedAt: asOf,
    validThrough,
    explanation: `Current qualifying evidence agrees on a canonical value for claim "${claim.claimKey}"`,
  };
}

export function resolveEvidence({ claim, observations, asOf }: ResolveEvidenceInput): EvidenceResolution {
  assertIsoDate(asOf, "asOf");
  const freshnessWindowDays = freshnessWindowFor(claim.category);
  const classified = observations.flatMap((observation): ClassifiedObservation[] => {
    if (
      observation.subjectType !== claim.subjectType ||
      observation.subjectId !== claim.subjectId ||
      observation.claimKey !== claim.claimKey ||
      !scopeMatches(claim.scope, observation.scope) ||
      observation.lastCheckedAt > asOf ||
      (observation.effectiveFrom !== undefined && observation.effectiveFrom > asOf)
    ) {
      return [];
    }
    const rule = authorityRuleFor(observation.sourceType, claim.category);
    if (!rule) return [];
    const freshnessExpiry = addDaysToIsoDate(observation.lastCheckedAt, freshnessWindowDays);
    const validThrough = observation.effectiveTo
      ? earlierIsoDate(freshnessExpiry, observation.effectiveTo)
      : freshnessExpiry;
    const canonical = valueKey(observation);
    return [{
      observation,
      ...rule,
      current: asOf <= validThrough,
      validThrough,
      valueKey: canonical.key,
      value: canonical.value,
    }];
  });

  const currentQualifying = classified.filter((observation) => observation.current && observation.qualifying);
  if (currentQualifying.length > 0) {
    const highestRank = Math.max(...currentQualifying.map(({ rank }) => rank));
    return resolveCurrent(
      claim,
      currentQualifying.filter(({ rank }) => rank === highestRank),
      freshnessWindowDays,
      asOf,
    );
  }

  const staleQualifying = classified.filter((observation) => !observation.current && observation.qualifying);
  if (staleQualifying.length > 0) {
    const highestRank = Math.max(...staleQualifying.map(({ rank }) => rank));
    const selected = staleQualifying.filter(({ rank }) => rank === highestRank);
    return {
      state: "needs_recheck",
      authority: selected[0]!.authority,
      sourceIds: sourceIds(selected),
      freshnessWindowDays,
      resolvedAt: asOf,
      validThrough: latestIsoDate(selected.map(({ validThrough }) => validThrough)),
      explanation: `Previously qualifying evidence for claim "${claim.claimKey}" is stale`,
    };
  }

  const currentEditorial = classified.filter((observation) => observation.current && !observation.qualifying);
  if (currentEditorial.length > 0) {
    return resolveCurrent(claim, currentEditorial, freshnessWindowDays, asOf);
  }

  return {
    state: "not_verified",
    sourceIds: [],
    freshnessWindowDays,
    resolvedAt: asOf,
    explanation: `No current qualifying or editorial evidence matches claim "${claim.claimKey}" and its material scope`,
  };
}

export function downgradeEvidenceForBrowser(
  deployed: EvidenceResolution,
  browserAsOf: string,
): EvidenceResolution {
  assertIsoDate(browserAsOf, "browserAsOf");
  if (browserAsOf <= deployed.resolvedAt || !deployed.validThrough || browserAsOf <= deployed.validThrough) {
    return deployed;
  }
  if (deployed.state === "verified_fact" || deployed.state === "not_applicable") {
    return {
      ...deployed,
      state: "needs_recheck",
      value: undefined,
      resolvedAt: browserAsOf,
      explanation: `Deployed evidence expired after ${deployed.validThrough}; browser downgrade requires recheck`,
    };
  }
  if (deployed.state === "editorial_assessment" || (deployed.state === "conflicting" && deployed.authority === "editorial")) {
    return {
      ...deployed,
      state: "not_verified",
      value: undefined,
      resolvedAt: browserAsOf,
      explanation: `Deployed non-qualifying evidence expired after ${deployed.validThrough}`,
    };
  }
  if (deployed.state === "conflicting") {
    return {
      ...deployed,
      state: "needs_recheck",
      value: undefined,
      resolvedAt: browserAsOf,
      explanation: `Evidence required to preserve the deployed conflict expired after ${deployed.validThrough}`,
    };
  }
  return deployed;
}

export function downgradeScenarioEvidenceForBrowser(
  scenario: DomainScenario,
  browserAsOf: string,
): DomainScenario {
  return {
    ...scenario,
    candidates: scenario.candidates.map((candidate) => ({
      ...candidate,
      claims: candidate.claims.map((claim) => ({
        ...claim,
        evidence: downgradeEvidenceForBrowser(claim.evidence, browserAsOf),
      })),
    })),
  };
}
