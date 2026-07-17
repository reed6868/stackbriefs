import type { DimensionContent, OfferContent, SourceContent } from "./records";

export function validateDimensionObservation(source: SourceContent, dimension: DimensionContent) {
  if (dimension.valueType === "boolean") {
    return typeof source.observedValue === "boolean"
      ? undefined
      : `must be a boolean for Dimension "${dimension.id}"`;
  }

  if (dimension.valueType === "number") {
    if (typeof source.observedValue !== "number" || !Number.isFinite(source.observedValue)) {
      return `must be a finite number for Dimension "${dimension.id}"`;
    }
    return source.observedUnit === dimension.unit
      ? undefined
      : `must use unit "${dimension.unit}" for Dimension "${dimension.id}"`;
  }

  const allowedValues = dimension.allowedValues.map(({ value }) => value);
  if (dimension.valueType === "enum") {
    return typeof source.observedValue === "string" && allowedValues.includes(source.observedValue)
      ? undefined
      : `must be one of ${allowedValues.join(", ")} for Dimension "${dimension.id}"`;
  }

  if (!Array.isArray(source.observedValue)) {
    return `must be an array for Dimension "${dimension.id}"`;
  }
  const invalid = source.observedValue.find((value) => !allowedValues.includes(value as string));
  return invalid === undefined
    ? undefined
    : `contains non-canonical value "${String(invalid)}" for Dimension "${dimension.id}"`;
}

export function validateOfferObservation(source: SourceContent, offer: OfferContent) {
  if (source.observedUnit) return "Offer observations cannot declare a unit";

  const claims = {
    status: offer.status,
    terms: offer.terms,
    region: offer.region,
  } as const;
  if (!(source.claimKey in claims)) {
    return `claimKey must resolve to status, terms, or region on Offer "${offer.id}"`;
  }

  const expected = claims[source.claimKey as keyof typeof claims];
  if (expected === undefined) {
    return `claimKey "${source.claimKey}" is not present on Offer "${offer.id}"`;
  }
  return source.observedValue === expected
    ? undefined
    : `must equal the Offer ${source.claimKey} value "${expected}"`;
}
