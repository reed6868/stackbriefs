import { isIndexableTarget } from "../domain/public-inputs";
import { publicationOptionsFromEnvironment } from "./build-context";

export function seoIndexableFromEnvironment() {
  return isIndexableTarget(publicationOptionsFromEnvironment().target);
}
