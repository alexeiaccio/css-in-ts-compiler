import {
  type ActionStep,
  type Json,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintValue } from "@quint-machine/core";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintValue | undefined): number => (value === undefined ? 0 : Number(value));

// The fixed span tree, mirroring specs/apg/timeline.qnt.
const LAST_NODE = 5;
const NODES = [1, 2, 3, 4, 5] as const;

const PARENT_OF: ReadonlyArray<number> = [0, 0, 1, 2, 2, 1];
const FIRST_CHILD: ReadonlyArray<number> = [0, 2, 3, 0, 0, 0];
const parentOf = (n: number): number => PARENT_OF[n] ?? 0;
const firstChild = (n: number): number => FIRST_CHILD[n] ?? 0;
const isParent = (n: number): boolean => firstChild(n) !== 0;
const weight = (n: number): number => (n >= 1 && n <= LAST_NODE ? 2 ** (n - 1) : 0);
const bit = (mask: number, n: number): boolean => (mask & weight(n)) !== 0;

const parentOpen = (n: number, expanded: number): boolean =>
  parentOf(n) === 0 || bit(expanded, parentOf(n));
const visible = (n: number, expanded: number): boolean =>
  n >= 1 && n <= LAST_NODE && parentOpen(n, expanded) && parentOpen(parentOf(n), expanded);

// The DOM driver addresses parts as `<name>:<index>` with a 0-based index, so
// row N (span id N, 1..5) is the part target `row:N-1`.
const rowTarget = (n: number): string => `row:${n - 1}`;
const nodeOf = (target: string | undefined): number => {
  const [name = "", index = ""] = (target ?? "").split(":");
  const node = Number(index) + 1;
  if (name === "row" && node >= 1 && node <= LAST_NODE) {
    return node;
  }
  throw new Unsupported(`part ${target ?? ""}`);
};

/**
 * Scenario `config` -> what both targets are mounted with. `selected` is the
 * initial selection (uncontrolled, or the accepting host's starting value).
 * `controlled` puts the value in a host that accepts every request (a page that
 * keeps the state in a signal); pinning `value` instead means a fixed prop, so
 * every request is rejected.
 */
export interface TimelineConfig {
  readonly defaultExpanded: ReadonlyArray<number>;
  /** Initial selection: uncontrolled default, or the accepting host's start. */
  readonly selected: number;
  readonly viewStart: number;
  readonly viewEnd: number;
  /** The host owns the selection (`value` prop present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned value the host holds (rejects every request). */
  readonly pinned: number | null;
}

const nodeValue = (key: string, value: Json | undefined): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > LAST_NODE) {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * Timeline vocabulary <-> `specs/apg/timeline.qnt`, shared by the spec driver
 * and the DOM driver.
 *
 * Parts: `row:0`..`row:4` (span ids 1..5) and `ruler` (the zoom window slider).
 * The zoom window is fixed to the full domain (it is not the controlled value);
 * anything else throws `Unsupported`, which skips the scenario on every target.
 */
export const timelineConfig = (config: ScenarioConfig): TimelineConfig => {
  let selected = 0;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    if (key === "controlled" && typeof value === "boolean") {
      controlled ||= value;
    } else if (key === "selected") {
      selected = nodeValue(key, value);
    } else if (key === "value") {
      pinned = nodeValue(key, value);
      controlled = true;
    } else {
      throw new Unsupported(`config ${key}=${String(value)}`);
    }
  }
  return {
    defaultExpanded: [],
    selected,
    viewStart: 0,
    viewEnd: 100,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

const keyEventOf = (key: string): string | undefined => {
  switch (key) {
    case "ArrowDown":
      return "pressDown";
    case "ArrowUp":
      return "pressUp";
    case "ArrowRight":
      return "pressRight";
    case "ArrowLeft":
      return "pressLeft";
    case "Home":
      return "pressHome";
    case "End":
      return "pressEnd";
    case "Enter":
      return "pressEnter";
    default:
      return undefined;
  }
};

const programmatic = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "zoomIn":
    case "zoomOut":
    case "zoomReset":
    case "panLeft":
    case "panRight":
      return [specEvent(step.prop)];
    case "select": {
      const node = nodeValue("select", step.value);
      if (node < 1) {
        throw new Unsupported(`select ${JSON.stringify(step.value)}`);
      }
      return [specEvent("selectNode", { node: BigInt(node) })];
    }
    case "setValue": {
      const value = nodeValue("setValue", step.value);
      return [specEvent("setValue", { v: BigInt(value) })];
    }
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const timelineBridge: SpecBridge = {
  setup: (config) => {
    const timeline = timelineConfig(config);
    if (timeline.controlled) {
      const initial = timeline.pinned ?? timeline.selected;
      return [
        specEvent("control"),
        ...(initial === 0 ? [] : [specEvent("setValue", { v: BigInt(initial) })]),
        ...(timeline.accepts ? [specEvent("acceptRequests")] : []),
      ];
    }
    return timeline.selected === 0
      ? []
      : [specEvent("selectNode", { node: BigInt(timeline.selected) })];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focusNode", { node: BigInt(nodeOf(step.target)) })];
      case "blur":
        nodeOf(step.target);
        return [specEvent("blurTimeline")];
      case "click":
        return [specEvent("click", { node: BigInt(nodeOf(step.target)) })];
      case "key": {
        const node = nodeOf(step.target);
        const tag = keyEventOf(step.key ?? "");
        if (tag === undefined) {
          throw new Unsupported(`key ${step.key ?? ""} on ${step.target ?? ""}`);
        }
        return [specEvent("focusNode", { node: BigInt(node) }), specEvent(tag)];
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        return programmatic(step);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state) => (state["hasFocus"] === true ? rowTarget(num(state["focus"])) : null),
  attr: (state, target, name) => {
    if (target === "ruler") {
      if (name === "aria-valuemin") {
        return String(num(state["viewStart"]));
      }
      if (name === "aria-valuenow") {
        return String(num(state["viewStart"]));
      }
      if (name === "aria-valuemax") {
        return String(num(state["viewEnd"]));
      }
      throw new Unsupported(`attribute ${name} on ruler`);
    }
    const node = nodeOf(target);
    const expanded = num(state["expanded"]);
    if (name === "aria-expanded") {
      return isParent(node) ? (bit(expanded, node) ? "true" : "false") : null;
    }
    if (name === "aria-selected") {
      return num(state["selected"]) === node ? "true" : "false";
    }
    if (name === "tabindex") {
      return num(state["focus"]) === node ? "0" : "-1";
    }
    if (name === "hidden") {
      return visible(node, expanded) ? null : "true";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) => {
    const expanded = num(state["expanded"]);
    return NODES.flatMap((node) => (visible(node, expanded) ? [rowTarget(node)] : []));
  },
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onValueChange", num(after["requested"])] as const],
};

/** The user-level steps a differential walk draws from. */
export const timelineSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "row:0" },
  { event: "key", key: "ArrowDown", target: "row:0" },
  { event: "key", key: "ArrowUp", target: "row:1" },
  { event: "key", key: "ArrowRight", target: "row:0" },
  { event: "key", key: "ArrowLeft", target: "row:1" },
  { event: "key", key: "Home", target: "row:2" },
  { event: "key", key: "End", target: "row:2" },
  { event: "key", key: "Enter", target: "row:0" },
  { event: "click", target: "row:0" },
  { event: "prop", prop: "select", value: 3 },
  { event: "prop", prop: "select", value: 1 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "setValue", value: 4 },
  { event: "prop", prop: "zoomIn" },
  { event: "prop", prop: "zoomOut" },
  { event: "prop", prop: "zoomReset" },
  { event: "prop", prop: "panLeft" },
  { event: "prop", prop: "panRight" },
];

const rowProbe = (node: number): ReadonlyArray<readonly [string, string]> => [
  [rowTarget(node), "aria-expanded"],
  [rowTarget(node), "aria-selected"],
  [rowTarget(node), "tabindex"],
  [rowTarget(node), "hidden"],
];

export const timelineProbe: Probe = {
  attrs: [
    ...NODES.flatMap(rowProbe),
    ["ruler", "aria-valuemin"],
    ["ruler", "aria-valuenow"],
    ["ruler", "aria-valuemax"],
  ],
  events: ["onValueChange"],
};
