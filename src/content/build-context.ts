import type { PublicationOptions } from "../domain/model";
import { resolveBuildTarget } from "./build-target";

export { resolveBuildTarget } from "./build-target";

export function publicationOptionsFromEnvironment(): PublicationOptions {
  return {
    target: resolveBuildTarget(import.meta.env.STACKBRIEFS_BUILD_TARGET),
    asOf: import.meta.env.STACKBRIEFS_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
  };
}
