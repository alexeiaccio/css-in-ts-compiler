import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number => Number(value ?? 0);

/** The spec's fixed grid size (`specs/apg/grid.qnt`). */
export const GRID_ROWS = 4;
export const GRID_COLS = 3;

export type GridKindName = "data" | "layout";
export type GridFocusTargetName = "cell" | "widget";

/**
 * The options `createGrid` is mounted with; the bridge and the fixture share it.
 * The spec is fixed at 4x3, so differential walks only use that size.
 */
export interface GridConfig {
  readonly rows: number;
  readonly cols: number;
  readonly gridKind: GridKindName;
  readonly wrapCols: boolean;
  readonly wrapRows: boolean;
  readonly focusTarget: GridFocusTargetName;
  readonly gridReadonly: boolean;
  readonly selectable: boolean;
  readonly sortEnabled: boolean;
  /** The host owns the selected rectangle (`value` prop present). */
  readonly selectionControlled: boolean;
  /** Controlled selection only: the host writes every request's intent back. */
  readonly selectionAccepts: boolean;
  /** Controlled selection only: a pinned packed value the host holds (rejects). */
  readonly selectionValue: number | null;
  /** The host owns the sort (`sortValue` prop present). */
  readonly sortControlled: boolean;
  /** Controlled sort only: the host writes every request's intent back. */
  readonly sortAccepts: boolean;
  /** Controlled sort only: a pinned packed value the host holds (rejects). */
  readonly sortValue: number | null;
}

const DEFAULTS: GridConfig = {
  rows: GRID_ROWS,
  cols: GRID_COLS,
  gridKind: "data",
  wrapCols: false,
  wrapRows: false,
  focusTarget: "cell",
  gridReadonly: false,
  selectable: false,
  sortEnabled: false,
  selectionControlled: false,
  selectionAccepts: false,
  selectionValue: null,
  sortControlled: false,
  sortAccepts: false,
  sortValue: null,
};

/** The valid packed selection values the fixed 4x3 grid can hold (0 = none). */
const SELECTION_VALUES = new Set([
  0, 1, 5, 6, 9, 10, 11, 13, 14, 15, 16, 49, 53, 54, 57, 58, 59, 61, 62, 63, 64, 65, 69, 70, 73, 74,
  75, 77, 78, 79, 80, 97, 101, 102, 105, 106, 107, 109, 110, 111, 112, 113, 117, 118, 121, 122, 123,
  125, 126, 127, 128, 129, 133, 134, 137, 138, 139, 141, 142, 143, 144,
]);

/** The valid packed sort values: -1 unsorted, else 2*column + (desc ? 1 : 0). */
const SORT_VALUES = new Set([-1, 0, 1, 4, 5]);

export const isSelectionValue = (value: number): boolean => SELECTION_VALUES.has(value);

export const isSortValue = (value: number): boolean => SORT_VALUES.has(value);

const positiveInt = (key: string, value: Schema.Json): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
  return value;
};

const bool = (key: string, value: Schema.Json): boolean => {
  if (typeof value !== "boolean") {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * Scenario `config` -> what both targets are mounted with. Keys the primitive
 * does not model (orientation, rtl, virtualized windows, looping callbacks,
 * ragged columns, ...) make the scenario `Unsupported` on every target.
 */
export const normalizeGridConfig = (
  config: ScenarioConfig,
  base: Partial<GridConfig> = {},
): GridConfig => {
  let rows = base.rows ?? DEFAULTS.rows;
  let cols = base.cols ?? DEFAULTS.cols;
  let gridKind = base.gridKind ?? DEFAULTS.gridKind;
  let wrapCols = base.wrapCols ?? DEFAULTS.wrapCols;
  let wrapRows = base.wrapRows ?? DEFAULTS.wrapRows;
  let focusTarget = base.focusTarget ?? DEFAULTS.focusTarget;
  let gridReadonly = base.gridReadonly ?? DEFAULTS.gridReadonly;
  let selectable = base.selectable ?? DEFAULTS.selectable;
  let sortEnabled = base.sortEnabled ?? DEFAULTS.sortEnabled;
  let selectionControlled = base.selectionControlled ?? DEFAULTS.selectionControlled;
  let selectionValue = base.selectionValue ?? DEFAULTS.selectionValue;
  let sortControlled = base.sortControlled ?? DEFAULTS.sortControlled;
  let sortValue = base.sortValue ?? DEFAULTS.sortValue;
  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "rows":
        rows = positiveInt(key, value);
        break;
      case "cols":
        cols = positiveInt(key, value);
        break;
      case "layout":
        if (value !== "grid") {
          throw new Unsupported(`config layout=${JSON.stringify(value)}`);
        }
        break;
      case "gridKind":
        if (value !== "data" && value !== "layout") {
          throw new Unsupported(`config gridKind=${JSON.stringify(value)}`);
        }
        gridKind = value;
        break;
      case "wrapCols":
        wrapCols = bool(key, value);
        break;
      case "wrapRows":
        wrapRows = bool(key, value);
        break;
      case "focusTarget":
        if (value !== "cell" && value !== "widget") {
          throw new Unsupported(`config focusTarget=${JSON.stringify(value)}`);
        }
        focusTarget = value;
        break;
      case "gridReadonly":
      case "readonly":
        gridReadonly = bool(key, value);
        break;
      case "selectable":
        selectable = bool(key, value);
        break;
      case "sortEnabled":
        sortEnabled = bool(key, value);
        break;
      case "controlled":
        if (typeof value !== "boolean") {
          throw new Unsupported(`config controlled=${JSON.stringify(value)}`);
        }
        selectionControlled ||= value;
        break;
      case "selection":
        if (typeof value !== "number" || !SELECTION_VALUES.has(value)) {
          throw new Unsupported(`config selection=${JSON.stringify(value)}`);
        }
        selectionValue = value;
        selectionControlled = true;
        break;
      case "sortControlled":
        if (typeof value !== "boolean") {
          throw new Unsupported(`config sortControlled=${JSON.stringify(value)}`);
        }
        sortControlled ||= value;
        break;
      case "sort":
        if (typeof value !== "number" || !SORT_VALUES.has(value)) {
          throw new Unsupported(`config sort=${JSON.stringify(value)}`);
        }
        sortValue = value;
        sortControlled = true;
        break;
      case "enableHomeAndEndKeys":
        // the spec always supports Home/End; the flag only turns them off
        if (value !== true) {
          throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
        }
        break;
      case "loopFocus":
        // no wrapping is the spec's data-grid behaviour
        if (value !== false) {
          throw new Unsupported(`config loopFocus=${JSON.stringify(value)}`);
        }
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  if (gridKind === "data") {
    wrapCols = false;
    wrapRows = false;
  }
  return {
    rows,
    cols,
    gridKind,
    wrapCols,
    wrapRows,
    focusTarget,
    gridReadonly,
    selectable,
    sortEnabled,
    selectionControlled,
    selectionAccepts: selectionControlled && selectionValue === null,
    selectionValue,
    sortControlled,
    sortAccepts: sortControlled && sortValue === null,
    sortValue,
  };
};

export const gridConfig = (config: ScenarioConfig): GridConfig => normalizeGridConfig(config);

const CELL = /^cell:(\d+),(\d+)$/;
const WIDGET = /^cell:(\d+),(\d+)\/widget$/;

interface Cell {
  readonly row: number;
  readonly col: number;
}

const cellOf = (target: string | undefined): Cell => {
  const match = CELL.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return { row: Number(match[1]), col: Number(match[2]) };
};

const widgetOf = (target: string | undefined): Cell => {
  const match = WIDGET.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return { row: Number(match[1]), col: Number(match[2]) };
};

const isGridTarget = (target: string | undefined): boolean =>
  target === undefined || target === "grid";

/** The spec key pool (`grid.qnt`'s `key` nondet set). */
const GRID_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "Control+Home",
  "Control+End",
  "PageUp",
  "PageDown",
  "Enter",
  "F2",
  "Escape",
  "a",
  "Tab",
  "Shift+Tab",
]);

/**
 * `grid.qnt` is NAVIGATION-ONLY (map ticket rt1p): focus is roving internal
 * state, so there is no host-owned value here and the bridge has no `value` /
 * `events`. Controlled selection and sort are modelled by
 * `grid-selection.bridge.ts` / `grid-sort.bridge.ts`.
 */
export const gridBridge: SpecBridge = {
  setup: (config) => {
    const value = gridConfig(config);
    return [
      ...(value.gridKind === "layout" ? [specEvent("set_kind", { choice: "layout" })] : []),
      ...(value.wrapCols ? [specEvent("set_wrap_cols", { flag: true })] : []),
      ...(value.wrapRows ? [specEvent("set_wrap_rows", { flag: true })] : []),
      ...(value.focusTarget === "widget"
        ? [specEvent("set_focus_target", { choice: "widget" })]
        : []),
      ...(value.gridReadonly ? [specEvent("set_readonly", { flag: true })] : []),
    ];
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
        if (!GRID_KEYS.has(step.key ?? "")) {
          throw new Unsupported(`key ${step.key ?? ""}`);
        }
        return [specEvent("key", { key: step.key ?? "" })];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        switch (step.prop) {
          case "gridKind":
          case "kind":
            if (step.value !== "data" && step.value !== "layout") {
              throw new Unsupported(`prop ${step.prop}=${JSON.stringify(step.value)}`);
            }
            return [specEvent("set_kind", { choice: step.value })];
          case "wrapCols":
            return [specEvent("set_wrap_cols", { flag: step.value === true })];
          case "wrapRows":
            return [specEvent("set_wrap_rows", { flag: step.value === true })];
          case "focusTarget":
            if (step.value !== "cell" && step.value !== "widget") {
              throw new Unsupported(`prop focusTarget=${JSON.stringify(step.value)}`);
            }
            return [specEvent("set_focus_target", { choice: step.value })];
          case "readonly":
          case "gridReadonly":
            return [specEvent("set_readonly", { flag: step.value === true })];
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state) => {
    if (state["hasFocus"] !== true) {
      return null;
    }
    return `cell:${num(state["row"])},${num(state["col"])}`;
  },
  attr: (state, target, name) => {
    if (isGridTarget(target)) {
      if (name === "aria-rowcount") {
        return String(GRID_ROWS);
      }
      if (name === "aria-colcount") {
        return String(GRID_COLS);
      }
      if (name === "aria-readonly") {
        return state["gridReadonly"] === true ? "true" : "false";
      }
      throw new Unsupported(`attribute ${name} on grid`);
    }
    const widget = WIDGET.exec(target);
    if (widget !== null) {
      if (name !== "tabindex") {
        throw new Unsupported(`attribute ${name} on ${target}`);
      }
      const cell = widgetOf(target);
      const active =
        state["focusTarget"] === "widget" &&
        cell.row === num(state["row"]) &&
        cell.col === num(state["col"]);
      return active ? "0" : "-1";
    }
    const cell = cellOf(target);
    switch (name) {
      case "tabindex": {
        const active =
          state["focusTarget"] === "cell" &&
          cell.row === num(state["row"]) &&
          cell.col === num(state["col"]);
        return active ? "0" : "-1";
      }
      case "aria-rowindex":
        return String(cell.row + 1);
      case "aria-colindex":
        return String(cell.col + 1);
      case "aria-readonly":
        return state["gridReadonly"] === true || cell.col === GRID_COLS - 1 ? "true" : "false";
      case "aria-selected":
        throw new Unsupported("selection is modelled by grid-selection.bridge");
      default:
        throw new Unsupported(`attribute ${name} on ${target}`);
    }
  },
  visible: () => [],
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const gridSteps: ReadonlyArray<ActionStep> = [
  ...Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => ({
    event: "click" as const,
    target: `cell:${Math.floor(index / GRID_COLS)},${index % GRID_COLS}`,
  })),
  ...[
    "ArrowRight",
    "ArrowLeft",
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "Control+Home",
    "Control+End",
    "PageUp",
    "PageDown",
    "Enter",
    "F2",
    "Escape",
    "a",
    "Tab",
    "Shift+Tab",
  ].map((key) => ({ event: "key" as const, key, target: "grid" })),
  { event: "focus", target: "grid" },
  { event: "blur", target: "grid" },
  { event: "prop", prop: "gridKind", value: "layout" },
  { event: "prop", prop: "gridKind", value: "data" },
  { event: "prop", prop: "wrapCols", value: true },
  { event: "prop", prop: "wrapCols", value: false },
  { event: "prop", prop: "wrapRows", value: true },
  { event: "prop", prop: "wrapRows", value: false },
  { event: "prop", prop: "focusTarget", value: "widget" },
  { event: "prop", prop: "focusTarget", value: "cell" },
  { event: "prop", prop: "readonly", value: true },
  { event: "prop", prop: "readonly", value: false },
];

const GRID_CELL_ATTRS = ["tabindex", "aria-rowindex", "aria-colindex", "aria-readonly"] as const;

const cellTargets = (): ReadonlyArray<readonly [string, string]> =>
  Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    return GRID_CELL_ATTRS.map((name) => [`cell:${row},${col}`, name] as const);
  }).flat();

export const gridProbe: Probe = {
  attrs: [
    ["grid", "aria-rowcount"],
    ["grid", "aria-colcount"],
    ["grid", "aria-readonly"],
    ...cellTargets(),
    ...Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      return [`cell:${row},${col}/widget`, "tabindex"] as const;
    }),
  ],
  events: [],
};
