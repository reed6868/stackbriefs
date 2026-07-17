import { evidenceStateLabel, formatDimensionValue } from "../components/decision/presentation";
import {
  downgradeToolDetailForBrowser,
  resolveToolEntryContext,
  type ToolDetailProjection,
} from "../domain/tool-detail";
import { requiredElement } from "./dom";

function mountToolDetailController(root: HTMLElement) {
  const encodedProjection = root.dataset.toolProjection;
  if (!encodedProjection) return;
  const deployedDetail = JSON.parse(decodeURIComponent(encodedProjection)) as ToolDetailProjection;
  const browserAsOf = new Date().toISOString().slice(0, 10);
  const detail = downgradeToolDetailForBrowser(deployedDetail, browserAsOf);
  const params = new URLSearchParams(location.search);
  const resolved = resolveToolEntryContext(detail, {
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

  detail.contexts.forEach((context) => {
    const contextElement = requiredElement<HTMLElement>(root, `[data-tool-context="${context.scenarioSlug}"]`);
    const claimRows = new Map(
      [...contextElement.querySelectorAll<HTMLElement>("[data-tool-claim]")]
        .map((row) => [row.dataset.toolClaim ?? "", row] as const),
    );
    context.claims.forEach((claim) => {
      const row = claimRows.get(claim.dimensionId);
      if (!row) throw new Error(`Tool detail controller requires Claim row for ${claim.dimensionId}`);
      requiredElement<HTMLElement>(row, "[data-evidence-value]").textContent =
        formatDimensionValue(claim.dimension, claim.evidence.value);
      const badge = requiredElement<HTMLElement>(row, ".evidence-badge");
      badge.dataset.evidenceState = claim.evidence.state;
      badge.textContent = evidenceStateLabel(claim.evidence.state);
    });
  });

  const offer = root.querySelector<HTMLElement>("[data-tool-offer]");
  if (offer) offer.hidden = !detail.offer;

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
