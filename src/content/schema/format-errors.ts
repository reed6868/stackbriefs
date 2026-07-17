import type { ContentGraphInput, GraphIssue } from "./graph-types";
import type { PublicationHistoryInput } from "./publication-history";

type ValidationInput = ContentGraphInput & { publicationHistory?: PublicationHistoryInput };

function formatIssuePath(path: PropertyKey[], input: ValidationInput) {
  const [collection, index, ...rest] = path;
  if (typeof collection === "string" && collection in input && typeof index === "number") {
    const records = input[collection as keyof ValidationInput];
    if (Array.isArray(records)) {
      const record = records[index] as { id?: string } | undefined;
      const label = record?.id ?? String(index);
      return `${collection}[${label}]${rest.length ? `.${rest.join(".")}` : ""}`;
    }
  }
  return path.join(".");
}

export function formatValidationError(issues: readonly GraphIssue[], input: ValidationInput) {
  const details = issues
    .map((validationIssue) => `${formatIssuePath(validationIssue.path, input)}: ${validationIssue.message}`)
    .sort()
    .join("\n");
  return new Error(`Content validation failed:\n${details}`);
}
