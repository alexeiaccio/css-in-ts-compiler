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

/** The spec's fixed body (`specs/patterns/focusgrid.qnt`). */
export const FOCUSGRID_ROWS = 3;
export const FOCUSGRID_COLS = 4;
export const FOCUSGRID_CELLS = FOCUSGRID_ROWS * FOCUSGRID_COLS;

export type FocusGridEdgeName = "none" | "wrap" | "flow";

/**
 * The definition both targets are mounted with. `manual` selects the topology
 * token (and the `focusgrouprow` markers) and nothing else; the edges are the
 * RESOLVED per-axis values, so the token grammar's conflicts (`wrap flow`,
 * `nowrap` with either) cannot arise here — the attribute we emit is canonical.
 */
export interface FocusGridConfig {
  readonly rowEdge: FocusGridEdgeName;
  readonly colEdge: FocusGridEdgeName;
  readonly memory: boolean;
  readonly manual: boolean;
  /** The `focusgroupstart` cell; 0 is "no marker", the first cell. */
  readonly start: number;
}

const DEFAULTS: FocusGridConfig = {
  rowEdge: "none",
  colEdge: "none",
  memory: true,
  manual: false,
  start: 0,
};

const edgeOf = (key: string, value: Schema.Json | undefined): FocusGridEdgeName => {
  if (value === "none" || value === "wrap" || value === "flow") {
    return value;
  }
  throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
};

const bool = (key: string, value: Schema.Json | undefined): boolean => {
  if (typeof value !== "boolean") {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
  return value;
};

const cellIndex = (key: string, value: Schema.Json | undefined): number => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value >= FOCUSGRID_CELLS
  ) {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
  return value;
};

/** Scenario `config` -> the definition; a key the spec does not model is unsupported. */
export const focusgridConfig = (config: ScenarioConfig): FocusGridConfig => {
  let rowEdge = DEFAULTS.rowEdge;
  let colEdge = DEFAULTS.colEdge;
  let memory = DEFAULTS.memory;
  let manual = DEFAULTS.manual;
  let start = DEFAULTS.start;
  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "rows":
        if (value !== FOCUSGRID_ROWS) {
          throw new Unsupported(`config rows=${JSON.stringify(value)}`);
        }
        break;
      case "cols":
        if (value !== FOCUSGRID_COLS) {
          throw new Unsupported(`config cols=${JSON.stringify(value)}`);
        }
        break;
      case "rowEdge":
        rowEdge = edgeOf(key, value);
        break;
      case "colEdge":
        colEdge = edgeOf(key, value);
        break;
      case "memory":
        memory = bool(key, value);
        break;
      case "manual":
        manual = bool(key, value);
        break;
      case "start":
        start = cellIndex(key, value);
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { rowEdge, colEdge, memory, manual, start };
};

/** The canonical `focusgroup` attribute of a definition: hard edges emit no token. */
export const focusgridAttribute = (config: FocusGridConfig): string => {
  const tokens = ["grid"];
  if (config.manual) {
    tokens.push("manual");
  }
  if (config.rowEdge !== "none") {
    tokens.push(config.rowEdge === "wrap" ? "rowwrap" : "rowflow");
  }
  if (config.colEdge !== "none") {
    tokens.push(config.colEdge === "wrap" ? "colwrap" : "colflow");
  }
  if (!config.memory) {
    tokens.push("nomemory");
  }
  return tokens.join(" ");
};

/** The `data-part` address of a cell, shared with the fixture and the driver. */
export const focusGridCell = (row: number, col: number): string => `cell:${row},${col}`;

const CELL = /^cell:(\d+),(\d+)$/;

const cellOf = (target: string | undefined): { row: number; col: number; index: number } => {
  const match = CELL.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  const row = Number(match[1]);
  const col = Number(match[2]);
  if (row >= FOCUSGRID_ROWS || col >= FOCUSGRID_COLS) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return { row, col, index: row * FOCUSGRID_COLS + col };
};

const isGridTarget = (target: string | undefined): boolean =>
  target === undefined || target === "grid";

/** The spec's key pool (`focusgrid.qnt`'s `key` nondet set). */
const FOCUSGRID_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "Control+Home",
  "Control+End",
  "Shift+ArrowRight",
  "Alt+Home",
  "Meta+ArrowDown",
]);

/**
 * Focus group grid vocabulary <-> `specs/patterns/focusgrid.qnt`. Parts: `grid`
 * (the owner) and `cell:<row>,<col>` (the twelve cell targets). Keys are
 * dispatched to the focused element, so a key step names `grid` (or nothing) and
 * never a cell; a `focus` on a cell is the model's `click` (focus plus the tab
 * stop), and `blur`/`focus` on the grid are the model's `focus_out`/`focus_in`.
 */
export const focusgridBridge: SpecBridge = {
  setup: (config) => {
    const c = focusgridConfig(config);
    return [
      ...(c.manual ? [specEvent("set_manual", { flag: true })] : []),
      ...(c.rowEdge === "none" ? [] : [specEvent("set_row_edge", { e: c.rowEdge })]),
      ...(c.colEdge === "none" ? [] : [specEvent("set_col_edge", { e: c.colEdge })]),
      ...(c.memory ? [] : [specEvent("set_memory", { on: false })]),
      ...(c.start === 0 ? [] : [specEvent("set_start", { i: BigInt(c.start) })]),
    ];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "key": {
        if (!FOCUSGRID_KEYS.has(step.key ?? "")) {
          throw new Unsupported(`key ${step.key ?? ""}`);
        }
        if (!isGridTarget(step.target)) {
          throw new Unsupported(`key on ${step.target ?? ""}`);
        }
        return [specEvent("key", { k: step.key ?? "" })];
      }
      case "focus": {
        if (isGridTarget(step.target)) {
          return [specEvent("focus_in")];
        }
        const { index } = cellOf(step.target);
        return [specEvent("click", { cell: BigInt(index) })];
      }
      case "blur":
        if (!isGridTarget(step.target)) {
          throw new Unsupported(`blur on ${step.target ?? ""}`);
        }
        return [specEvent("focus_out")];
      case "click": {
        const { index } = cellOf(step.target);
        return [specEvent("click", { cell: BigInt(index) })];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        switch (step.prop) {
          case "rowEdge":
            return [specEvent("set_row_edge", { e: edgeOf("rowEdge", step.value) })];
          case "colEdge":
            return [specEvent("set_col_edge", { e: edgeOf("colEdge", step.value) })];
          case "memory":
            return [specEvent("set_memory", { on: step.value === true })];
          case "manual":
            return [specEvent("set_manual", { flag: step.value === true })];
          case "start":
            return [specEvent("set_start", { i: BigInt(cellIndex("start", step.value)) })];
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
    const cur = num(state["cur"]);
    return focusGridCell(Math.floor(cur / FOCUSGRID_COLS), cur % FOCUSGRID_COLS);
  },
  attr: (state, target, name) => {
    if (isGridTarget(target)) {
      if (name === "focusgroup") {
        return focusgridAttribute({
          rowEdge: (state["rowEdge"] as FocusGridEdgeName | undefined) ?? "none",
          colEdge: (state["colEdge"] as FocusGridEdgeName | undefined) ?? "none",
          memory: state["memory"] === true,
          manual: state["manual"] === true,
          start: num(state["start"]),
        });
      }
      throw new Unsupported(`attribute ${name} on grid`);
    }
    const { index } = cellOf(target);
    switch (name) {
      case "tabindex":
        return index === num(state["tabStop"]) ? "0" : "-1";
      case "focusgroupstart":
        return index === num(state["start"]) ? "true" : null;
      default:
        throw new Unsupported(`attribute ${name} on ${target}`);
    }
  },
  visible: () => [],
  events: () => [],
};

const allCells = (): ReadonlyArray<readonly [number, number]> =>
  Array.from(
    { length: FOCUSGRID_CELLS },
    (_, index) => [Math.floor(index / FOCUSGRID_COLS), index % FOCUSGRID_COLS] as const,
  );

/** The user-level steps a differential walk draws from. */
export const focusgridSteps: ReadonlyArray<ActionStep> = [
  ...allCells().map(([row, col]) => ({ event: "click" as const, target: focusGridCell(row, col) })),
  ...[...FOCUSGRID_KEYS].map((key) => ({ event: "key" as const, key, target: "grid" })),
  { event: "focus", target: "grid" },
  { event: "blur", target: "grid" },
  { event: "prop", prop: "rowEdge", value: "none" },
  { event: "prop", prop: "rowEdge", value: "wrap" },
  { event: "prop", prop: "rowEdge", value: "flow" },
  { event: "prop", prop: "colEdge", value: "none" },
  { event: "prop", prop: "colEdge", value: "wrap" },
  { event: "prop", prop: "colEdge", value: "flow" },
  { event: "prop", prop: "memory", value: true },
  { event: "prop", prop: "memory", value: false },
  { event: "prop", prop: "manual", value: true },
  { event: "prop", prop: "manual", value: false },
  ...[1, 5, 7, 11].flatMap((start) => [
    { event: "prop" as const, prop: "start", value: start },
    { event: "prop" as const, prop: "start", value: 0 },
  ]),
];

export const focusgridProbe: Probe = {
  attrs: [
    ["grid", "focusgroup"],
    ...allCells().flatMap(([row, col]) => {
      const target = focusGridCell(row, col);
      return [[target, "tabindex"] as const, [target, "focusgroupstart"] as const];
    }),
  ],
  events: [],
};
