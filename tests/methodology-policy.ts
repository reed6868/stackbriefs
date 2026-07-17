export const prohibitedMethodologyClaimPatterns = [
  /\bwinner\b/i,
  /\b(?:best|top)\b/i,
  /\b(?:score|scored|scoring)\b/i,
  /\bconfidence\b/i,
  /\b(?:source majority|majority of (?:the )?(?:sources|evidence)|more sources)\b/i,
  /\b(?:source count|number of sources)\b[^.!?\n]{0,100}\b(?:decides?|determines?|wins?|resolves?)\b/i,
] as const;

export function matchingProhibitedMethodologyClaims(text: string) {
  return prohibitedMethodologyClaimPatterns.filter((pattern) => pattern.test(text));
}
