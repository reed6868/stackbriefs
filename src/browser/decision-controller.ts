import type {
  CandidateEvaluation,
  ConditionEvaluation,
  DecisionCondition,
  DecisionEvaluation,
} from "../domain/decision";
import { evaluateDecision } from "../domain/decision";
import { downgradeScenarioEvidenceForBrowser } from "../domain/evidence";
import type { DomainCandidate, DomainScenario } from "../domain/model";
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
  relevantCheckDate,
  resultSummaryText,
} from "../components/decision/presentation";

type HistoryMode = "push" | "replace";

function requiredElement<Element extends globalThis.Element>(root: ParentNode, selector: string) {
  const element = root.querySelector<Element>(selector);
  if (!element) throw new Error(`Decision controller requires ${selector}`);
  return element;
}

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
    const forms = [desktopForm, mobileForm];
    let state: UrlState;
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

    const applyConditions = (
      conditions: readonly DecisionCondition[],
      historyMode: HistoryMode,
      focusSummary: boolean,
    ) => {
      state = normalizeUrlState(scenario, { ...state, conditions });
      writeHistory(historyMode);
      syncForms();
      renderEvaluation(root, scenario, evaluateDecision(scenario, state.conditions));
      if (focusSummary) focusResultSummary(resultSummary);
    };

    const restoreLocation = (focusSummary: boolean) => {
      state = parseUrlState(scenario, { search: location.search, hash: location.hash });
      writeHistory("replace");
      syncForms();
      renderEvaluation(root, scenario, evaluateDecision(scenario, state.conditions));
      if (focusSummary) focusResultSummary(resultSummary);
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

    matchMedia("(min-width: 48rem)").addEventListener("change", safely((event) => {
      if (event.matches && dialog.open) closeDialog();
    }), { signal: controllerEvents.signal });
    addEventListener("popstate", safely(() => {
      if (dialog.open) {
        closeDialog(resultSummary);
        restoreLocation(false);
        return;
      }
      restoreLocation(true);
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
