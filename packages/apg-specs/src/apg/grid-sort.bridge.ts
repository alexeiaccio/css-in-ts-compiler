import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import { type GridConfig, isSortValue, normalizeGridConfig } from "./grid.bridge";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number => Number(value ?? 0);

/** The sort spec's fixed header row (`grid-sort.qnt`). */
const SORT_COLS = 3;
/** Columns 0 and 2 sort; column 1 does not (`sortable`). */
const sortable = (col: number): boolean => col !== 1;

/**
 * `grid-sort.qnt`: the header row of a sortable data grid. Mounts `createGrid`
 * with `sortEnabled: true`; reads `aria-sort` and the header roving tabindex.
 */
export const gridSortConfig = (config: ScenarioConfig): GridConfig =>
  normalizeGridConfig(config, { sortEnabled: true });

const HEADER = /^header:(\d+)$/;

const headerOf = (target: string | undefined): number => {
  const match = HEADER.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  return Number(match[1]);
};

const SORT_KEYS = new Set(["ArrowRight", "ArrowLeft", "Home", "End", "Enter", "Space"]);

/** The DOM reports the space bar as `" "`, the spec as `"Space"`. */
const canonicalKey = (key: string | undefined): string => (key === " " ? "Space" : (key ?? ""));

export const gridSortBridge: SpecBridge = {
  setup: (config) => {
    const value = gridSortConfig(config);
    const events: QuintEvent[] = value.sortEnabled
      ? []
      : [specEvent("set_sort_enabled", { flag: false })];
    if (value.sortControlled) {
      events.push(specEvent("control"));
      const initial = value.sortValue ?? -1;
      if (initial !== -1) {
        events.push(specEvent("setValue", { v: BigInt(initial) }));
      }
      if (value.sortAccepts) {
        events.push(specEvent("acceptRequests"));
      }
    }
    return events;
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        if (step.target === undefined || step.target === "grid") {
          return [specEvent("focus_in")];
        }
        throw new Unsupported(`focus ${step.target}`);
      case "blur":
        return [specEvent("focus_out")];
      case "click":
        return [specEvent("click", { column: BigInt(headerOf(step.target)) })];
      case "key": {
        const key = canonicalKey(step.key);
        if (!SORT_KEYS.has(key)) {
          throw new Unsupported(`key ${step.key ?? ""}`);
        }
        return [specEvent("key", { key })];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        if (step.prop === "sortEnabled") {
          return [specEvent("set_sort_enabled", { flag: step.value === true })];
        }
        if (step.prop === "setValue") {
          if (typeof step.value !== "number" || !isSortValue(step.value)) {
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
  focus: (state) => (state["hasFocus"] === true ? `header:${num(state["headerCol"])}` : null),
  attr: (state, target, name) => {
    const col = headerOf(target);
    if (name === "aria-sort") {
      if (state["sortEnabled"] !== true || !sortable(col)) {
        return null;
      }
      if (col !== num(state["sortCol"])) {
        return "none";
      }
      return String(state["sortDir"]);
    }
    if (name === "tabindex") {
      return col === num(state["headerCol"]) ? "0" : "-1";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [["onValueChange", Number(after["requested"])] as const],
};

export const gridSortSteps: ReadonlyArray<ActionStep> = [
  ...Array.from({ length: SORT_COLS }, (_, col) => ({
    event: "click" as const,
    target: `header:${col}`,
  })),
  ...["ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "].map((key) => ({
    event: "key" as const,
    key,
    target: "grid",
  })),
  { event: "blur", target: "grid" },
  { event: "prop", prop: "sortEnabled", value: false },
  { event: "prop", prop: "sortEnabled", value: true },
  { event: "prop", prop: "setValue", value: 4 },
  { event: "prop", prop: "setValue", value: -1 },
  { event: "prop", prop: "hostToggle" },
];

export const gridSortProbe: Probe = {
  attrs: Array.from({ length: SORT_COLS }, (_, col) => {
    return [[`header:${col}`, "tabindex"] as const, [`header:${col}`, "aria-sort"] as const];
  }).flat(),
  events: ["onValueChange"],
};
