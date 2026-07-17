import type { ToolContextReference } from "../domain/tool-detail";
import { resolveToolEntryContext } from "../domain/tool-detail";
import { requiredElement } from "./dom";

function mountToolDetailController(root: HTMLElement) {
  const encodedContexts = root.dataset.toolContexts;
  if (!encodedContexts) return;
  const contexts = JSON.parse(decodeURIComponent(encodedContexts)) as ToolContextReference[];
  const params = new URLSearchParams(location.search);
  const resolved = resolveToolEntryContext({ contexts }, {
    scenarioSlug: params.get("scenario") ?? undefined,
    returnValue: params.get("return") ?? undefined,
    origin: location.origin,
  });

  if (resolved.context && resolved.returnHref) {
    const breadcrumb = requiredElement<HTMLElement>(root, "[data-tool-scenario-breadcrumb]");
    const breadcrumbLink = requiredElement<HTMLAnchorElement>(breadcrumb, "a");
    breadcrumb.hidden = false;
    breadcrumbLink.href = resolved.returnHref;
    breadcrumbLink.textContent = resolved.context.scenarioTitle;

    const returnLink = requiredElement<HTMLAnchorElement>(root, "[data-tool-return]");
    returnLink.hidden = false;
    returnLink.href = resolved.returnHref;
    returnLink.textContent = `Return to ${resolved.context.scenarioTitle}`;
    root.querySelector<HTMLElement>(`[data-tool-context="${resolved.context.scenarioSlug}"]`)
      ?.setAttribute("data-active-context", "true");
  }

  const image = root.querySelector<HTMLImageElement>("[data-tool-logo-image]");
  const fallback = requiredElement<HTMLElement>(root, "[data-tool-logo-fallback]");
  if (!image) return;
  const showFallback = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  image.addEventListener("error", showFallback, { once: true });
  if (image.complete && image.naturalWidth === 0) showFallback();
}

export function mountToolDetailControllers() {
  document.querySelectorAll<HTMLElement>("[data-tool-detail-controller]")
    .forEach(mountToolDetailController);
}
