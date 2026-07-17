import type { BuildTarget, PublicationOptions } from "../domain/model";

const buildTargets = new Set<BuildTarget>(["development", "preview", "production"]);

export function resolveBuildTarget(value: string | undefined): BuildTarget {
  if (value === undefined || value === "") return "development";
  if (buildTargets.has(value as BuildTarget)) return value as BuildTarget;
  throw new Error(`STACKBRIEFS_BUILD_TARGET must be development, preview, or production; received "${value}"`);
}

export function publicationOptionsFromEnvironment(): PublicationOptions {
  return {
    target: resolveBuildTarget(import.meta.env.STACKBRIEFS_BUILD_TARGET),
    asOf: import.meta.env.STACKBRIEFS_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
  };
}
