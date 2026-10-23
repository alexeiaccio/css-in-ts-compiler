import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

export type TreegridNav = "rowsFirst" | "cellsFirst" | "cellsOnly";
export type TreegridSelection = "single" | "multi";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number => Number(value ?? 0);

/** The spec fixes a 3-column, 7-row tree (`treegrid.qnt`). */
export const TREEGRID_ROWS = 7;
export const TREEGRID_COLS = 3;
/** The spec's parent map: A > {A.1, A.2 > {A.2.1}}, B > {B.1, B.2}. */
const PARENTS: ReadonlyArray<number> = [-1, 0, 0, 2, -1, 4, 4];

export interface TreegridConfig {
  readonly nav: TreegridNav;
  readonly selection: TreegridSelection;
  /** Controlled: the host owns the selected rows and this is the only thing that changes them. */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back as the value. */
  readonly accepts: boolean;
  /** The controlled (or initial) selected rows. */
  readonly selected: ReadonlyArray<number>;
}

const ROWS = TREEGRID_ROWS;

const rowIndicesOf = (value: Schema.Json | undefined): ReadonlyArray<number> => {
  if (!Array.isArray(value)) {
    throw new Unsupported(`selected=${JSON.stringify(value)}`);
  }
  const rows: number[] = [];
  for (const entry of value) {
    let row = Number.NaN;
    if (typeof entry === "number") {
      row = entry;
    } else if (typeof entry === "string") {
      row = Number(entry);
    }
    if (!Number.isInteger(row) || row < 0 || row >= ROWS) {
      throw new Unsupported(`selected row ${JSON.stringify(entry)}`);
    }
    rows.push(row);
  }
  return rows;
};

/**
 * Scenario `config` -> mount options. The spec models a fixed tree only, so any
 * dynamic `tree` / `columns` / `expanded` config is `Unsupported`. `controlled`
 * (with `accepts`) is a host that owns the selection; a bare `selected` array is
 * a pinned value, i.e. a host that rejects every request.
 */
export const treegridConfig = (config: ScenarioConfig): TreegridConfig => {
  let nav: TreegridNav = "rowsFirst";
  let selection: TreegridSelection = "single";
  let controlled = false;
  let accepts = false;
  let pinned = false;
  let selected: ReadonlyArray<number> = [];
  for (const [key, value] of Object.entries(config)) {
    if (key === "nav" || key === "navModel") {
      if (value !== "rowsFirst" && value !== "cellsFirst" && value !== "cellsOnly") {
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
      }
      nav = value;
    } else if (key === "selection" || key === "selMode") {
      if (value !== "single" && value !== "multi") {
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
      }
      selection = value;
    } else if (key === "controlled" && typeof value === "boolean") {
      controlled = value;
      accepts = value;
    } else if (key === "accepts" && typeof value === "boolean") {
      controlled = true;
      accepts = value;
    } else if (key === "selected") {
      selected = rowIndicesOf(value);
      controlled = true;
      pinned = true;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  if (pinned) {
    accepts = false;
  }
  return { nav, selection, controlled, accepts, selected };
};

const parentOf = (row: number): number => PARENTS[row] ?? -1;
const hasChildren = (row: number): boolean => PARENTS.some((parent) => parent === row);
const childCount = (parent: number): number => PARENTS.filter((p) => p === parent).length;

const isExpanded = (state: QuintModelValue, row: number): boolean => {
  if (row === 0) {
    return state["exp0"] === true;
  }
  if (row === 2) {
    return state["exp2"] === true;
  }
  if (row === 4) {
    return state["exp4"] === true;
  }
  return false;
};
const visible = (state: QuintModelValue, row: number): boolean => {
  if (row < 0 || row >= TREEGRID_ROWS) {
    return false;
  }
  let p = parentOf(row);
  while (p >= 0) {
    if (!isExpanded(state, p)) {
      return false;
    }
    p = parentOf(p);
  }
  return true;
};
const ariaLevel = (row: number): number => {
  let level = 1;
  let p = parentOf(row);
  while (p >= 0) {
    level += 1;
    p = parentOf(p);
  }
  return level;
};
const ariaSetSize = (row: number): number => {
  const p = parentOf(row);
  return p < 0 ? PARENTS.filter((x) => x < 0).length : childCount(p);
};
const ariaPosInSet = (row: number): number => {
  const p = parentOf(row);
  let pos = 0;
  for (let r = 0; r <= row; r += 1) {
    if (parentOf(r) === p) {
      pos += 1;
    }
  }
  return pos;
};
const bitSet = (mask: number, row: number): boolean => (mask & (1 << row)) !== 0;
const maskOfRows = (rows: ReadonlyArray<number>): number =>
  rows.reduce((mask, row) => mask | (1 << row), 0);
const rowsOf = (mask: number): ReadonlyArray<number> =>
  Array.from({ length: TREEGRID_ROWS }, (_, row) => row).filter((row) => bitSet(mask, row));

const CELL = /^cell:(\d+),(\d+)$/;
const ROW = /^row:(\d+)$/;
const EXPANDER = /^row:(\d+)\/expander$/;

const cellOf = (target: string | undefined) => {
  const match = CELL.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return { row: Number(match[1]), col: Number(match[2]) };
};

const KEY_EVENTS = new Map<string, string>([
  ["ArrowRight", "right"],
  ["ArrowLeft", "left"],
  ["ArrowDown", "down"],
  ["ArrowUp", "up"],
  ["Home", "home"],
  ["End", "end"],
  ["Control+Home", "ctrlHome"],
  ["Control+End", "ctrlEnd"],
  ["Enter", "enter"],
  ["Shift+Space", "toggleSelect"],
  ["Control+a", "selectAll"],
  ["Shift+ArrowDown", "extendDown"],
  ["Shift+ArrowUp", "extendUp"],
]);

export const treegridBridge: SpecBridge = {
  setup: (config) => {
    const value = treegridConfig(config);
    return [
      ...(value.nav === "rowsFirst" ? [] : [specEvent("configureNav", { nav: value.nav })]),
      ...(value.selection === "single"
        ? []
        : [specEvent("configureSel", { sel: value.selection })]),
      ...(value.controlled
        ? [
            specEvent("control"),
            ...(value.accepts ? [specEvent("acceptRequests")] : []),
            ...(value.selected.length > 0
              ? [
                  specEvent("setValue", {
                    v: BigInt(maskOfRows(value.selected)),
                  }),
                ]
              : []),
          ]
        : []),
    ];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        if (step.target === undefined || step.target === "grid") {
          return [specEvent("focusIn")];
        }
        if (CELL.test(step.target)) {
          const { row, col } = cellOf(step.target);
          return [specEvent("clickCell", { cell: BigInt(row * TREEGRID_COLS + col) })];
        }
        throw new Unsupported(`focus ${step.target}`);
      case "blur":
        return [specEvent("blur")];
      case "click": {
        const expander = EXPANDER.exec(step.target ?? "");
        if (expander !== null) {
          const row = Number(expander[1]);
          if (!hasChildren(row)) {
            throw new Unsupported(`expander ${step.target}`);
          }
          return [specEvent("toggleRow", { r: BigInt(row) })];
        }
        const { row, col } = cellOf(step.target);
        return [specEvent("clickCell", { cell: BigInt(row * TREEGRID_COLS + col) })];
      }
      case "key": {
        const tag = KEY_EVENTS.get(step.key ?? "");
        if (tag === undefined) {
          throw new Unsupported(`key ${step.key ?? ""}`);
        }
        return [specEvent(tag)];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        switch (step.prop) {
          case "nav":
          case "navModel":
            if (
              step.value !== "rowsFirst" &&
              step.value !== "cellsFirst" &&
              step.value !== "cellsOnly"
            ) {
              throw new Unsupported(`prop nav=${JSON.stringify(step.value)}`);
            }
            return [specEvent("configureNav", { nav: step.value })];
          case "selection":
          case "selMode":
            if (step.value !== "single" && step.value !== "multi") {
              throw new Unsupported(`prop selection=${JSON.stringify(step.value)}`);
            }
            return [specEvent("configureSel", { sel: step.value })];
          case "selected":
          case "setValue":
            return [
              specEvent("setValue", {
                v: BigInt(maskOfRows(rowIndicesOf(step.value))),
              }),
            ];
          case "hostToggle":
            return [specEvent("hostToggle", { r: 0n })];
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state) => {
    if (state["inGrid"] !== true) {
      return null;
    }
    return state["kind"] === "row"
      ? `row:${num(state["frow"])}`
      : `cell:${num(state["frow"])},${num(state["fcol"])}`;
  },
  attr: (state, target, name) => {
    if (target === "grid") {
      if (name === "aria-multiselectable") {
        return state["selMode"] === "multi" ? "true" : null;
      }
      throw new Unsupported(`attribute ${name} on grid`);
    }
    const rowMatch = ROW.exec(target);
    if (rowMatch !== null) {
      const row = Number(rowMatch[1]);
      switch (name) {
        case "aria-level":
          return String(ariaLevel(row));
        case "aria-setsize":
          return String(ariaSetSize(row));
        case "aria-posinset":
          return String(ariaPosInSet(row));
        case "aria-expanded":
          return hasChildren(row) ? (isExpanded(state, row) ? "true" : "false") : null;
        case "aria-selected": {
          const selected = bitSet(num(state["selMask"]), row);
          if (selected) {
            return "true";
          }
          return state["selMode"] === "multi" ? "false" : null;
        }
        case "tabindex":
          return visible(state, row) && state["kind"] === "row" && num(state["frow"]) === row
            ? "0"
            : "-1";
        default:
          throw new Unsupported(`attribute ${name} on ${target}`);
      }
    }
    const cell = cellOf(target);
    if (name === "tabindex") {
      return visible(state, cell.row) &&
        state["kind"] === "cell" &&
        num(state["frow"]) === cell.row &&
        num(state["fcol"]) === cell.col
        ? "0"
        : "-1";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [["onSelectionChange", rowsOf(Number(after["requested"]))] as const],
};

export const treegridSteps: ReadonlyArray<ActionStep> = [
  ...Array.from({ length: TREEGRID_ROWS * TREEGRID_COLS }, (_, index) => ({
    event: "click" as const,
    target: `cell:${Math.floor(index / TREEGRID_COLS)},${index % TREEGRID_COLS}`,
  })),
  { event: "click", target: "row:0/expander" },
  { event: "click", target: "row:2/expander" },
  { event: "click", target: "row:4/expander" },
  ...[
    "ArrowRight",
    "ArrowLeft",
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "Control+Home",
    "Control+End",
    "Enter",
    "Shift+Space",
    "Control+a",
    "Shift+ArrowDown",
    "Shift+ArrowUp",
  ].map((key) => ({ event: "key" as const, key, target: "grid" })),
  { event: "focus", target: "grid" },
  { event: "blur", target: "grid" },
  { event: "prop", prop: "hostToggle" },
  { event: "prop", prop: "selected", value: [0] },
  { event: "prop", prop: "selected", value: [4] },
  { event: "prop", prop: "selected", value: [] },
];

export const treegridProbe: Probe = {
  attrs: [
    ["grid", "aria-multiselectable"],
    ...Array.from({ length: TREEGRID_ROWS }, (_, row) => {
      return [
        [`row:${row}`, "aria-level"] as const,
        [`row:${row}`, "aria-setsize"] as const,
        [`row:${row}`, "aria-posinset"] as const,
        [`row:${row}`, "aria-expanded"] as const,
        [`row:${row}`, "aria-selected"] as const,
        [`row:${row}`, "tabindex"] as const,
      ];
    }).flat(),
    ...Array.from({ length: TREEGRID_ROWS * TREEGRID_COLS }, (_, index) => {
      const row = Math.floor(index / TREEGRID_COLS);
      const col = index % TREEGRID_COLS;
      return [`cell:${row},${col}`, "tabindex"] as const;
    }),
  ],
  events: ["onSelectionChange"],
};
