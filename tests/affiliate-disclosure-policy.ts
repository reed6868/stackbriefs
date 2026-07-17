export const prohibitedAffiliateDisclosurePatterns = [
  /\b(?:best|top)\b/i,
  /\b(?:winner|ranked|ranking|score|scored|scoring)\b/i,
  /\b(?:featured|preferred) placement\b/i,
  /\b(?:higher|highest|largest) commission\b/i,
] as const;

export function matchingProhibitedAffiliateDisclosureClaims(text: string) {
  return prohibitedAffiliateDisclosurePatterns.filter((pattern) => pattern.test(text));
}
