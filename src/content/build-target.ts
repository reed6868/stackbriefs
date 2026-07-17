import type { BuildTarget } from "../domain/model";

const buildTargets = new Set<BuildTarget>(["development", "preview", "production"]);

export function resolveBuildTarget(value: string | undefined): BuildTarget {
  if (value === undefined || value === "") return "development";
  if (buildTargets.has(value as BuildTarget)) return value as BuildTarget;
  throw new Error(`STACKBRIEFS_BUILD_TARGET must be development, preview, or production; received "${value}"`);
}
