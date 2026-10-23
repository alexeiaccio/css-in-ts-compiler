import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import {
  GRID_COLS,
  GRID_ROWS,
  type GridConfig,
  isSelectionValue,
  normalizeGridConfig,
} from "./grid.bridge";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number => Number(value ?? 0);

/**
 * `grid-selection.qnt`: cell/row/column selection over the fixed 4x3 grid.
 * Mounts `createGrid` with `selectable: true`; reads `aria-selected` (present
 * only when the grid supports selection).
 */
export const gridSelectionConfig = (config: ScenarioConfig): GridConfig =>
  normalizeGridConfig(config, { selectable: true });

const CELL = /^cell:(\d+),(\d+)$/;

const cellOf = (target: string | undefined) => {
  const match = CELL.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return { row: Number(match[1]), col: Number(match[2]) };
};

const SELECTION_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Shift+ArrowRight",
  "Shift+ArrowLeft",
  "Shift+ArrowDown",
  "Shift+ArrowUp",
  "Shift+Space",
  "Control+Space",
  "Control+a",
  "Escape",
]);

const isGridTarget = (target: string | undefined): boolean =>
  target === undefined || target === "grid";

const inRect = (state: QuintModelValue, row: number, col: number): boolean =>
  state["selActive"] === true &&
  row >= num(state["selR0"]) &&
  row <= num(state["selR1"]) &&
  col >= num(state["selC0"]) &&
  col <= num(state["selC1"]);

export const gridSelectionBridge: SpecBridge = {
  setup: (config) => {
    const value = gridSelectionConfig(config);
    const events: QuintEvent[] = value.selectable
      ? []
      : [specEvent("set_selectable", { flag: false })];
    if (value.selectionControlled) {
      events.push(specEvent("control"));
      const initial = value.selectionValue ?? 0;
      if (initial !== 0) {
        events.push(specEvent("setValue", { v: BigInt(initial) }));
      }
      if (value.selectionAccepts) {
        events.push(specEvent("acceptRequests"));
      }
    }
    return events;
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus": {
        if (isGridTarget(step.target)) {
          return [specEvent("focus_in")];
        }
        const { row, col } = cellOf(step.target);
        return [specEvent("click", { cell: BigInt(row * GRID_COLS + col) })];
      }
      case "blur":
        return [specEvent("focus_out")];
      case "click": {
        const { row, col } = cellOf(step.target);
        return [specEvent("click", { cell: BigInt(row * GRID_COLS + col) })];
      }
      case "key": {
        if (!SELECTION_KEYS.has(step.key ?? "")) {
          throw new Unsupported(`key ${step.key ?? ""}`);
        }
        return [specEvent("key", { key: step.key ?? "" })];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        if (step.prop === "selectable") {
          return [specEvent("set_selectable", { flag: step.value === true })];
        }
        if (step.prop === "setValue") {
          if (typeof step.value !== "number" || !isSelectionValue(step.value)) {
            throw new Unsupported(`prop setValue=${JSON.stringify(step.value)}`);
          }
          return [specEvent("setValue", { v: BigInt(step.value) })];
        }
        if (step.prop === "hostToggle") {
          return [specEvent("hostToggle")];
        }
        throw new Unsupported(`prop ${step.prop ?? ""}`);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state) =>
    state["hasFocus"] === true ? `cell:${num(state["row"])},${num(state["col"])}` : null,
  attr: (state, target, name) => {
    const cell = cellOf(target);
    if (name === "aria-selected") {
      if (state["selectable"] !== true) {
        return null;
      }
      return inRect(state, cell.row, cell.col) ? "true" : "false";
    }
    if (name === "tabindex") {
      return cell.row === num(state["row"]) && cell.col === num(state["col"]) ? "0" : "-1";
    }
    if (name === "aria-rowindex") {
      return String(cell.row + 1);
    }
    if (name === "aria-colindex") {
      return String(cell.col + 1);
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [["onValueChange", Number(after["requested"])] as const],
};

export const gridSelectionSteps: ReadonlyArray<ActionStep> = [
  ...Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => ({
    event: "click" as const,
    target: `cell:${Math.floor(index / GRID_COLS)},${index % GRID_COLS}`,
  })),
  ...[
    "ArrowRight",
    "ArrowLeft",
    "ArrowDown",
    "ArrowUp",
    "Shift+ArrowRight",
    "Shift+ArrowLeft",
    "Shift+ArrowDown",
    "Shift+ArrowUp",
    "Shift+Space",
    "Control+Space",
    "Control+a",
    "Escape",
  ].map((key) => ({ event: "key" as const, key, target: "grid" })),
  { event: "focus", target: "grid" },
  { event: "blur", target: "grid" },
  { event: "prop", prop: "selectable", value: false },
  { event: "prop", prop: "selectable", value: true },
  { event: "prop", prop: "setValue", value: 5 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "hostToggle" },
];

export const gridSelectionProbe: Probe = {
  attrs: Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    return [
      [`cell:${row},${col}`, "tabindex"] as const,
      [`cell:${row},${col}`, "aria-selected"] as const,
    ];
  }).flat(),
  events: ["onValueChange"],
};
