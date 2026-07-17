import { evidenceStateLabel, formatDimensionValue } from "../components/decision/presentation";
import type { ComparisonProjection } from "../domain/comparison";
import { requiredElement } from "./dom";

function keyedElements<Element extends HTMLElement>(
  root: ParentNode,
  selector: string,
  key: (element: Element) => string,
) {
  return new Map([...root.querySelectorAll<Element>(selector)].map((element) => [key(element), element]));
}

export function createComparisonView(root: HTMLElement) {
  const section = requiredElement<HTMLElement>(root, "[data-comparison-section]");
  const heading = requiredElement<HTMLElement>(section, "[data-comparison-heading]");
  const table = requiredElement<HTMLTableElement>(section, "[data-comparison-table]");
  const headerRow = requiredElement<HTMLTableRowElement>(table, "thead tr");
  const toolHeaders = keyedElements<HTMLTableCellElement>(table, "[data-comparison-tool]", (element) =>
    element.dataset.comparisonTool ?? "");
  const rows = keyedElements<HTMLTableRowElement>(table, "[data-comparison-row]", (element) =>
    element.dataset.comparisonRow ?? "");
  const cells = keyedElements<HTMLTableCellElement>(table, "[data-comparison-cell]", (element) =>
    `${element.dataset.dimensionId}:${element.dataset.comparisonCell}`);
  const limitationRow = requiredElement<HTMLTableRowElement>(table, "[data-comparison-limitation-row]");
  const limitations = keyedElements<HTMLTableCellElement>(table, "[data-comparison-limitation]", (element) =>
    element.dataset.comparisonLimitation ?? "");

  const render = (projection: ComparisonProjection | undefined, open: boolean) => {
    toolHeaders.forEach((element) => { element.hidden = true; });
    cells.forEach((element) => { element.hidden = true; });
    limitations.forEach((element) => { element.hidden = true; });
    section.hidden = !projection || !open;
    if (!projection) return;
    table.style.setProperty("--comparison-table-width", `${11 + projection.columns.length * 15}rem`);

    projection.columns.forEach((column) => {
      const header = toolHeaders.get(column.toolSlug);
      const limitation = limitations.get(column.toolSlug);
      if (!header || !limitation) {
        throw new Error(`Comparison view requires markup for ${column.toolSlug}`);
      }
      header.hidden = false;
      header.dataset.eligibility = column.eligibility;
      requiredElement<HTMLElement>(header, "[data-comparison-eligibility]").textContent =
        column.eligibilityLabel;
      headerRow.append(header);
      limitation.hidden = false;
      limitation.textContent = column.limitation;
      limitationRow.append(limitation);
    });

    projection.rows.forEach((row) => {
      const tableRow = rows.get(row.dimensionId);
      if (!tableRow) throw new Error(`Comparison view requires row for ${row.dimensionId}`);
      row.cells.forEach((cell) => {
        const element = cells.get(`${row.dimensionId}:${cell.toolSlug}`);
        if (!element) {
          throw new Error(`Comparison view requires cell for ${row.dimensionId}:${cell.toolSlug}`);
        }
        element.hidden = false;
        requiredElement<HTMLElement>(element, "[data-comparison-value]").textContent =
          formatDimensionValue(row.dimension, cell.value);
        const badge = requiredElement<HTMLElement>(element, ".evidence-badge");
        badge.dataset.evidenceState = cell.evidenceState;
        badge.textContent = evidenceStateLabel(cell.evidenceState);
        const date = requiredElement<HTMLElement>(element, "[data-comparison-date]");
        date.hidden = !cell.lastCheckedAt;
        const time = requiredElement<HTMLTimeElement>(date, "time");
        time.dateTime = cell.lastCheckedAt ?? "";
        time.textContent = cell.lastCheckedAt ?? "";
        tableRow.append(element);
      });
    });
  };

  return {
    render,
    focusHeading() {
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "start", behavior: "auto" });
    },
  };
}
