import type {
  CandidateEvaluation,
  ConditionEvaluation,
  DecisionCondition,
  DecisionEvaluation,
} from "../domain/decision";
import { evaluateDecision } from "../domain/decision";
import { projectComparison } from "../domain/comparison";
import { relevantCheckDate } from "../domain/content-evidence";
import { downgradeScenarioEvidenceForBrowser } from "../domain/evidence";
import type { DomainCandidate, DomainScenario } from "../domain/model";
import {
  addShortlistItem,
  projectShortlist,
  removeShortlistItem,
} from "../domain/shortlist";
import {
  decisionCanonicalPath,
  normalizeUrlState,
  parseDecisionConditionValue,
  parseUrlState,
  serializeUrlState,
  type UrlState,
} from "../domain/url-state";
import {
  conditionExplanationText,
  conditionReasonText,
  evidenceStateLabel,
  exclusionReasons,
  formatDimensionValue,
  resultSummaryText,
} from "../components/decision/presentation";
import { createComparisonView } from "./comparison-view";
import { requiredElement } from "./dom";

type HistoryMode = "push" | "replace";

function filterControls(form: HTMLFormElement) {
  return [...form.querySelectorAll<HTMLElement>("[data-filter-control]")].map((control) => ({
    control,
    dimensionId: control.dataset.dimensionId ?? "",
    mode: requiredElement<HTMLSelectElement>(control, "[data-filter-mode]"),
    value: requiredElement<HTMLSelectElement>(control, "[data-filter-value]"),
  }));
}

function setFormConditions(form: HTMLFormElement, conditions: readonly DecisionCondition[]) {
  const active = new Map(conditions.map((condition) => [condition.dimensionId, condition]));
  filterControls(form).forEach(({ control, dimensionId, mode, value }) => {
    const condition = active.get(dimensionId);
    mode.value = condition?.mode ?? "inactive";
    if (condition) value.value = String(condition.value);
    control.dataset.conditionMode = mode.value;
  });
}

function readFormConditions(form: HTMLFormElement, scenario: DomainScenario) {
  const dimensions = new Map(scenario.dimensions.map((dimension) => [dimension.id, dimension]));
  return filterControls(form).flatMap(({ dimensionId, mode, value }): DecisionCondition[] => {
    if (mode.value !== "required" && mode.value !== "optional") return [];
    const dimension = dimensions.get(dimensionId);
    if (!dimension) return [];
    const parsedValue = parseDecisionConditionValue(dimension, value.value);
    return parsedValue === undefined
      ? []
      : [{ dimensionId, mode: mode.value, value: parsedValue }];
  });
}

function addEvidenceBadge(document: Document, parent: HTMLElement, evaluation: ConditionEvaluation) {
  const badge = document.createElement("span");
  badge.className = "evidence-badge";
  badge.dataset.evidenceState = evaluation.evidenceState;
  badge.textContent = evidenceStateLabel(evaluation.evidenceState);
  parent.append(badge);
}

function renderCandidateExplanations(
  card: HTMLElement,
  evaluation: CandidateEvaluation,
  document: Document,
) {
  const stateLabel = requiredElement<HTMLElement>(card, "[data-candidate-state-label]");
  const explanations = requiredElement<HTMLElement>(card, "[data-candidate-explanations]");
  const list = requiredElement<HTMLUListElement>(card, "[data-candidate-explanation-list]");
  const staticLimitation = requiredElement<HTMLElement>(card, "[data-candidate-static-limitation]");
  const hasConditions = evaluation.required.length + evaluation.optional.length > 0;

  stateLabel.textContent = hasConditions ? "Match" : "In scope";
  explanations.hidden = !hasConditions;
  staticLimitation.hidden = hasConditions;
  list.replaceChildren();
  if (!hasConditions) return;

  evaluation.explanations.forEach((explanation) => {
    const item = document.createElement("li");
    if (explanation.kind === "limitation") {
      item.className = "candidate-limitation";
      const label = document.createElement("strong");
      label.textContent = "Limitation: ";
      item.append(label, explanation.text);
    } else {
      item.dataset.conditionState = explanation.state;
      const text = document.createElement("span");
      text.textContent = conditionExplanationText(explanation);
      item.append(text);
      addEvidenceBadge(document, item, explanation);
    }
    list.append(item);
  });
}

function renderExclusionReason(
  document: Document,
  candidate: DomainCandidate,
  reason: ConditionEvaluation,
) {
  const item = document.createElement("li");
  const text = document.createElement("span");
  text.textContent = conditionReasonText(reason);
  const evidence = document.createElement("div");
  evidence.className = "excluded-candidate__evidence";
  addEvidenceBadge(document, evidence, reason);

  const claim = candidate.claims.find((candidateClaim) => candidateClaim.dimensionId === reason.dimensionId);
  const lastCheckedAt = claim ? relevantCheckDate(claim) : undefined;
  if (lastCheckedAt) {
    const checked = document.createElement("span");
    checked.className = "evidence-row__date";
    checked.append("Checked ");
    const time = document.createElement("time");
    time.dateTime = lastCheckedAt;
    time.textContent = lastCheckedAt;
    checked.append(time);
    evidence.append(checked);
  }
  item.append(text, evidence);
  return item;
}

function renderEvaluation(root: HTMLElement, scenario: DomainScenario, evaluation: DecisionEvaluation) {
  const document = root.ownerDocument;
  const candidates = new Map(scenario.candidates.map((candidate) => [candidate.id, candidate]));
  const summary = resultSummaryText(evaluation);
  requiredElement<HTMLElement>(root, "[data-result-heading]").textContent = summary.heading;
  requiredElement<HTMLElement>(root, "[data-result-description]").textContent = summary.description;

  const candidateList = requiredElement<HTMLElement>(root, "[data-candidate-list]");
  const candidateCards = new Map(
    [...root.querySelectorAll<HTMLElement>("[data-candidate-card]")]
      .map((card) => [card.dataset.candidateCard ?? "", card] as const),
  );
  candidateCards.forEach((card) => { card.hidden = true; });
  candidateList.hidden = evaluation.matches.length === 0;
  evaluation.matches.forEach((match) => {
    const card = candidateCards.get(match.candidateId);
    if (!card) return;
    card.hidden = false;
    card.dataset.evaluationState = match.state;
    renderCandidateExplanations(card, match, document);
    candidateList.append(card);
  });

  const excludedList = requiredElement<HTMLElement>(root, "[data-excluded-list]");
  const excludedRows = new Map(
    [...root.querySelectorAll<HTMLElement>("[data-excluded-candidate]")]
      .map((row) => [row.dataset.excludedCandidate ?? "", row] as const),
  );
  excludedRows.forEach((row) => { row.hidden = true; });
  excludedList.hidden = evaluation.exclusions.length === 0;
  const excludedContainer = requiredElement<HTMLElement>(excludedList, ".excluded-list__rows");
  evaluation.exclusions.forEach((excluded) => {
    const row = excludedRows.get(excluded.candidateId);
    const candidate = candidates.get(excluded.candidateId);
    if (!row || !candidate) return;
    row.hidden = false;
    row.dataset.evaluationState = excluded.state;
    requiredElement<HTMLElement>(row, "[data-excluded-state-label]").textContent =
      excluded.state === "unknown" ? "Unknown evidence" : "Does not match";
    const reasons = requiredElement<HTMLUListElement>(row, "[data-exclusion-reasons]");
    reasons.replaceChildren(...exclusionReasons(excluded).map((reason) =>
      renderExclusionReason(document, candidate, reason)));
    excludedContainer.append(row);
  });

  const zeroResults = requiredElement<HTMLElement>(root, "[data-zero-results]");
  const relaxationList = requiredElement<HTMLUListElement>(zeroResults, "[data-relaxation-list]");
  const relaxationEmpty = requiredElement<HTMLElement>(zeroResults, "[data-relaxation-empty]");
  zeroResults.hidden = evaluation.matches.length > 0;
  relaxationList.replaceChildren();
  evaluation.relaxations.forEach((relaxation) => {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    heading.textContent = `Review ${relaxation.label}`;
    const detail = document.createElement("span");
    const names = relaxation.candidateIds.map((candidateId) => candidates.get(candidateId)?.tool.name).filter(Boolean);
    detail.textContent = `${names.join(", ")} could match if this requirement changes.`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.dataset.relaxDimension = relaxation.dimensionId;
    button.textContent = `Make ${relaxation.label} optional`;
    item.append(heading, detail, button);
    relaxationList.append(item);
  });
  relaxationList.hidden = evaluation.relaxations.length === 0;
  relaxationEmpty.hidden = evaluation.relaxations.length > 0;
}

function renderEvidenceSummaries(root: HTMLElement, scenario: DomainScenario) {
  const summaries = new Map(
    [...root.querySelectorAll<HTMLElement>("[data-candidate-evidence-summary]")]
      .map((summary) => [summary.dataset.candidateEvidenceSummary ?? "", summary] as const),
  );
  scenario.candidates.forEach((candidate) => {
    const summary = summaries.get(candidate.id);
    if (!summary) throw new Error(`Decision controller requires evidence summary for ${candidate.id}`);
    const rows = new Map(
      [...summary.querySelectorAll<HTMLElement>("[data-evidence-row]")]
        .map((row) => [row.dataset.evidenceRow ?? "", row] as const),
    );
    candidate.claims.forEach((claim) => {
      const row = rows.get(claim.dimensionId);
      if (!row) throw new Error(`Decision controller requires evidence row for ${claim.dimensionId}`);
      requiredElement<HTMLElement>(row, "[data-evidence-value]").textContent =
        formatDimensionValue(claim.dimension, claim.evidence.value);
      const badge = requiredElement<HTMLElement>(row, ".evidence-badge");
      badge.dataset.evidenceState = claim.evidence.state;
      badge.textContent = evidenceStateLabel(claim.evidence.state);
    });
  });
}

function focusResultSummary(summary: HTMLElement) {
  summary.focus({ preventScroll: true });
  const bounds = summary.getBoundingClientRect();
  if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
    summary.scrollIntoView({ block: "start", behavior: "auto" });
  }
}

function mountDecisionController(root: HTMLElement) {
  const staticMarkup = root.innerHTML;
  const staticUrl = location.pathname;
  const controllerEvents = new AbortController();
  let failed = false;

  const failSafely = (error: unknown) => {
    if (failed) return;
    failed = true;
    controllerEvents.abort();
    document.documentElement.classList.remove("filter-open");
    document.documentElement.classList.remove("shortlist-open");
    root.innerHTML = staticMarkup;
    delete root.dataset.decisionEnhanced;
    if (`${location.pathname}${location.search}${location.hash}` !== staticUrl) {
      history.replaceState(null, "", staticUrl);
    }
    console.error("Decision controller failed; static projection remains available", error);
  };

  const safely = <EventType extends Event>(handler: (event: EventType) => void) =>
    (event: EventType) => {
      if (failed) return;
      try {
        handler(event);
      } catch (error) {
        failSafely(error);
      }
    };

  try {
    const encodedScenario = root.dataset.decisionScenario;
    if (!encodedScenario) throw new Error("Decision controller requires serialized Scenario data");
    const deployedScenario = JSON.parse(decodeURIComponent(encodedScenario)) as DomainScenario;
    const browserAsOf = new Date().toISOString().slice(0, 10);
    const scenario = downgradeScenarioEvidenceForBrowser(deployedScenario, browserAsOf);
    const staticCriteria = requiredElement<HTMLElement>(root, "[data-static-criteria]");
    const desktopPanel = requiredElement<HTMLElement>(root, "[data-desktop-filter-panel]");
    const desktopForm = requiredElement<HTMLFormElement>(root, '[data-decision-filter-form="desktop"]');
    const desktopClear = requiredElement<HTMLButtonElement>(desktopForm, "[data-clear-all]");
    const trigger = requiredElement<HTMLButtonElement>(root, "[data-filter-dialog-trigger]");
    const activeCount = requiredElement<HTMLElement>(trigger, "[data-active-filter-count]");
    const dialog = requiredElement<HTMLDialogElement>(root, "[data-filter-dialog]");
    const mobileForm = requiredElement<HTMLFormElement>(dialog, '[data-decision-filter-form="mobile"]');
    const mobileClear = requiredElement<HTMLButtonElement>(mobileForm, "[data-clear-all]");
    const resultSummary = requiredElement<HTMLElement>(root, "[data-result-summary]");
    const zeroResults = requiredElement<HTMLElement>(root, "[data-zero-results]");
    const shortlistDock = requiredElement<HTMLElement>(root, "[data-shortlist-dock]");
    const shortlistCount = requiredElement<HTMLElement>(shortlistDock, "[data-shortlist-count]");
    const shortlistList = requiredElement<HTMLUListElement>(shortlistDock, "[data-shortlist-items]");
    const compareShortlist = requiredElement<HTMLButtonElement>(shortlistDock, "[data-compare-shortlist]");
    const compareReason = requiredElement<HTMLElement>(shortlistDock, "[data-compare-reason]");
    const shortlistLimit = requiredElement<HTMLElement>(shortlistDock, "[data-shortlist-limit]");
    const shortlistMessage = requiredElement<HTMLElement>(shortlistDock, "[data-shortlist-message]");
    const shortlistItems = new Map(
      [...shortlistDock.querySelectorAll<HTMLElement>("[data-shortlist-item]")]
        .map((item) => [item.dataset.shortlistItem ?? "", item] as const),
    );
    const shortlistToggles = [...root.querySelectorAll<HTMLButtonElement>("[data-shortlist-toggle]")];
    const toolDetailLinks = [...root.querySelectorAll<HTMLAnchorElement>("[data-tool-detail-link]")];
    const comparisonView = createComparisonView(root);
    const forms = [desktopForm, mobileForm];
    let state: UrlState;
    let evaluation: DecisionEvaluation;
    let dialogFocusTarget: HTMLElement = trigger;

    const canonicalUrl = (nextState: UrlState) => {
      const serialized = serializeUrlState(scenario, nextState);
      return `${decisionCanonicalPath(scenario)}${serialized.search}${serialized.hash}`;
    };

    const syncForms = () => {
      forms.forEach((form) => setFormConditions(form, state.conditions));
      activeCount.textContent = `${state.conditions.length} active`;
    };

    const writeHistory = (mode: HistoryMode) => {
      const target = canonicalUrl(state);
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (target === current) return;
      history[`${mode}State`](null, "", target);
    };

    const syncToolDetailLinks = () => {
      const returnHref = canonicalUrl(state);
      toolDetailLinks.forEach((link) => {
        const target = new URL(link.href, location.origin);
        target.searchParams.set("scenario", scenario.slug);
        target.searchParams.set("return", returnHref);
        link.href = `${target.pathname}${target.search}`;
      });
    };

    const syncShortlist = () => {
      const projection = projectShortlist(scenario, evaluation, state.shortlist);
      const selected = new Set(projection.items.map((item) => item.toolSlug));
      shortlistItems.forEach((item) => { item.hidden = true; });
      projection.items.forEach((item) => {
        const row = shortlistItems.get(item.toolSlug);
        if (!row) throw new Error(`Decision controller requires shortlist row for ${item.toolSlug}`);
        row.hidden = false;
        row.dataset.eligibility = item.eligibility;
        requiredElement<HTMLElement>(row, "[data-shortlist-eligibility]").textContent =
          item.eligibilityLabel;
        shortlistList.append(row);
      });

      shortlistToggles.forEach((button) => {
        const toolSlug = button.dataset.toolSlug ?? "";
        const toolName = button.dataset.toolName ?? "Tool";
        const isSelected = selected.has(toolSlug);
        button.hidden = false;
        button.setAttribute("aria-pressed", String(isSelected));
        button.textContent = `${isSelected ? "Remove" : "Add"} ${toolName} ${isSelected ? "from" : "to"} shortlist`;
        if (projection.atLimit && !isSelected) {
          button.setAttribute("aria-disabled", "true");
          button.setAttribute("aria-describedby", "shortlist-limit-reason");
        } else {
          button.removeAttribute("aria-disabled");
          button.removeAttribute("aria-describedby");
        }
        const surface = button.closest<HTMLElement>("[data-candidate-card], [data-excluded-candidate]");
        if (surface) surface.dataset.shortlisted = String(isSelected);
      });

      shortlistCount.textContent = projection.countLabel;
      compareShortlist.disabled = !projection.canCompare;
      compareReason.hidden = projection.canCompare;
      compareReason.textContent = projection.compareReason ?? "";
      if (projection.canCompare) {
        compareShortlist.removeAttribute("aria-describedby");
      } else {
        compareShortlist.setAttribute("aria-describedby", "shortlist-compare-reason");
      }
      shortlistLimit.hidden = !projection.atLimit;
      shortlistLimit.textContent = projection.limitReason ?? "";
      shortlistMessage.hidden = true;
      shortlistMessage.textContent = "";
      shortlistDock.hidden = projection.items.length === 0;
      root.dataset.hasShortlist = String(projection.items.length > 0);
      document.documentElement.classList.toggle("shortlist-open", projection.items.length > 0);
    };

    const syncComparison = () => {
      comparisonView.render(
        projectComparison(scenario, evaluation, state.shortlist),
        state.comparison,
      );
    };

    const renderDecision = () => {
      evaluation = evaluateDecision(scenario, state.conditions);
      renderEvaluation(root, scenario, evaluation);
      syncShortlist();
      syncComparison();
      syncToolDetailLinks();
    };

    const applyConditions = (
      conditions: readonly DecisionCondition[],
      historyMode: HistoryMode,
      focusSummary: boolean,
    ) => {
      state = normalizeUrlState(scenario, { ...state, conditions });
      writeHistory(historyMode);
      syncForms();
      renderDecision();
      if (focusSummary) focusResultSummary(resultSummary);
    };

    const applyShortlist = (shortlist: readonly string[]) => {
      state = normalizeUrlState(scenario, { ...state, shortlist });
      writeHistory("replace");
      syncShortlist();
      syncComparison();
      syncToolDetailLinks();
    };

    const restoreLocation = (focusSummary: boolean) => {
      state = parseUrlState(scenario, { search: location.search, hash: location.hash });
      writeHistory("replace");
      syncForms();
      renderDecision();
      if (focusSummary) focusResultSummary(resultSummary);
    };

    const keepFocusedControlVisible = () => {
      if (shortlistDock.hidden) return;
      const focused = document.activeElement;
      if (!(focused instanceof HTMLElement) || !root.contains(focused)) return;
      if (focused.getBoundingClientRect().bottom > shortlistDock.getBoundingClientRect().top) {
        focused.scrollIntoView({ block: "center", behavior: "auto" });
      }
    };

    const focusVisibleShortlistToggle = (toolSlug: string) => {
      const toggle = shortlistToggles.find((button) =>
        button.dataset.toolSlug === toolSlug && button.getClientRects().length > 0);
      (toggle ?? resultSummary).focus();
    };

    const closeDialog = (focusTarget: HTMLElement = trigger) => {
      dialogFocusTarget = focusTarget;
      if (dialog.open) dialog.close();
    };

    desktopForm.addEventListener("change", safely(() => {
      applyConditions(readFormConditions(desktopForm, scenario), "replace", false);
    }), { signal: controllerEvents.signal });
    desktopClear.addEventListener("click", safely(() => {
      setFormConditions(desktopForm, []);
      applyConditions([], "replace", false);
    }), { signal: controllerEvents.signal });

    trigger.addEventListener("click", safely(() => {
      setFormConditions(mobileForm, state.conditions);
      dialog.showModal();
      document.documentElement.classList.add("filter-open");
      filterControls(mobileForm)[0]?.mode.focus();
    }), { signal: controllerEvents.signal });
    dialog.querySelectorAll<HTMLButtonElement>("[data-mobile-cancel]")
      .forEach((button) => button.addEventListener("click", safely(() => closeDialog()), {
        signal: controllerEvents.signal,
      }));
    dialog.addEventListener("cancel", safely((event) => {
      event.preventDefault();
      closeDialog();
    }), { signal: controllerEvents.signal });
    dialog.addEventListener("click", safely((event) => {
      if (event.target === dialog) closeDialog();
    }), { signal: controllerEvents.signal });
    dialog.addEventListener("close", safely(() => {
      document.documentElement.classList.remove("filter-open");
      const target = dialogFocusTarget;
      dialogFocusTarget = trigger;
      if (target === resultSummary) {
        focusResultSummary(resultSummary);
      } else {
        target.focus();
      }
    }), { signal: controllerEvents.signal });
    mobileForm.addEventListener("submit", safely((event) => {
      event.preventDefault();
      applyConditions(readFormConditions(mobileForm, scenario), "push", false);
      closeDialog(resultSummary);
    }), { signal: controllerEvents.signal });
    mobileClear.addEventListener("click", safely(() => {
      applyConditions([], "push", false);
      closeDialog(resultSummary);
    }), { signal: controllerEvents.signal });

    zeroResults.addEventListener("click", safely((event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-relax-dimension]");
      if (!button?.dataset.relaxDimension) return;
      const conditions = state.conditions.map((condition): DecisionCondition =>
        condition.dimensionId === button.dataset.relaxDimension && condition.mode === "required"
          ? { ...condition, mode: "optional" }
          : condition);
      applyConditions(conditions, "push", true);
    }), { signal: controllerEvents.signal });

    root.addEventListener("click", safely((event) => {
      const target = event.target as Element;
      const compare = target.closest<HTMLButtonElement>("[data-compare-shortlist]");
      if (compare && !compare.disabled) {
        state = normalizeUrlState(scenario, { ...state, comparison: true });
        writeHistory("push");
        syncComparison();
        comparisonView.focusHeading();
        return;
      }

      const toggle = target.closest<HTMLButtonElement>("[data-shortlist-toggle]");
      if (toggle?.dataset.toolSlug) {
        const toolSlug = toggle.dataset.toolSlug;
        if (state.shortlist.includes(toolSlug)) {
          applyShortlist(removeShortlistItem(state.shortlist, toolSlug));
        } else {
          const result = addShortlistItem(state.shortlist, toolSlug);
          if (result.kind === "rejected") {
            shortlistMessage.textContent = result.reason;
            shortlistMessage.hidden = false;
            keepFocusedControlVisible();
            return;
          }
          applyShortlist(result.shortlist);
        }
        keepFocusedControlVisible();
        return;
      }

      const remove = target.closest<HTMLButtonElement>("[data-shortlist-remove]");
      if (!remove?.dataset.toolSlug) return;
      const toolSlug = remove.dataset.toolSlug;
      const index = state.shortlist.indexOf(toolSlug);
      const focusSlug = state.shortlist[index + 1] ?? state.shortlist[index - 1];
      applyShortlist(removeShortlistItem(state.shortlist, toolSlug));
      if (focusSlug) {
        requiredElement<HTMLButtonElement>(shortlistItems.get(focusSlug)!, "[data-shortlist-remove]").focus();
      } else {
        focusVisibleShortlistToggle(toolSlug);
      }
      keepFocusedControlVisible();
    }), { signal: controllerEvents.signal });

    matchMedia("(min-width: 48rem)").addEventListener("change", safely((event) => {
      if (event.matches && dialog.open) closeDialog();
    }), { signal: controllerEvents.signal });
    addEventListener("popstate", safely(() => {
      if (dialog.open) {
        closeDialog(resultSummary);
        restoreLocation(false);
        return;
      }
      const wasComparisonOpen = state.comparison;
      restoreLocation(false);
      if (state.comparison) {
        comparisonView.focusHeading();
      } else if (wasComparisonOpen) {
        compareShortlist.focus();
      } else {
        focusResultSummary(resultSummary);
      }
    }), { signal: controllerEvents.signal });

    renderEvidenceSummaries(root, scenario);
    restoreLocation(false);
    staticCriteria.hidden = true;
    desktopPanel.hidden = false;
    trigger.hidden = false;
    root.dataset.decisionEnhanced = "true";
  } catch (error) {
    failSafely(error);
  }
}

export function mountDecisionControllers() {
  document.querySelectorAll<HTMLElement>("[data-decision-controller]").forEach(mountDecisionController);
}
