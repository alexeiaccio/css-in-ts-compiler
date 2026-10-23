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
  params: Record<string, boolean | bigint | string> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number =>
  value === undefined ? 0 : Number(value);

export type PanelsOrientation = "vertical" | "horizontal";

/** The layouts the spec reaches by a host write (hostEqual / hostWide / ...). */
export const PANELS_LAYOUTS = {
  initial: [20, 40, 40],
  equal: [30, 30, 40],
  wide: [50, 30, 20],
  narrow: [10, 40, 50],
  collapsed: [0, 50, 50],
} as const;

export type PanelsLayout = keyof typeof PANELS_LAYOUTS;

export const PANEL_COUNT = 3;
export const PANEL_MIN = 10;
export const PANEL_MAX = 80;

/**
 * Scenario `config` -> what both targets are mounted with. The spec is the
 * three-pane instance (MIN 10, MAX 80, 10% steps, pane 0 collapsible at 0), so
 * any other geometry is not modelled. `layout` only leaves the initial layout
 * through a host write, which needs `controlled`; an uncontrolled scenario that
 * starts elsewhere is `Unsupported` (it would have to be reached by keys, which
 * no ported scenario needs).
 */
export interface PanelsConfig {
  readonly orientation: PanelsOrientation;
  readonly layout: PanelsLayout;
  readonly sizes: ReadonlyArray<number>;
  readonly controlled: boolean;
  readonly accepts: boolean;
}

const isLayout = (value: Schema.Json | undefined): value is PanelsLayout =>
  typeof value === "string" && Object.hasOwn(PANELS_LAYOUTS, value);

export const resizablePanelsConfig = (config: ScenarioConfig): PanelsConfig => {
  let orientation: PanelsOrientation = "vertical";
  let layout: PanelsLayout = "initial";
  let controlled = false;
  let accepts = true;
  for (const [key, raw] of Object.entries(config)) {
    if (key === "orientation" && (raw === "vertical" || raw === "horizontal")) {
      orientation = raw;
    } else if (key === "layout" && isLayout(raw)) {
      layout = raw;
    } else if (key === "controlled" && typeof raw === "boolean") {
      controlled = raw;
    } else if (key === "accepts" && typeof raw === "boolean") {
      accepts = raw;
    } else if (key === "collapsible" && raw === true) {
      // pane 0 is collapsible in every instance the spec models
      continue;
    } else if (key === "panes" && raw === PANEL_COUNT) {
      continue;
    } else if (key === "min" && raw === PANEL_MIN) {
      continue;
    } else if (key === "max" && raw === PANEL_MAX) {
      continue;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  if (!controlled && layout !== "initial") {
    throw new Unsupported(`layout ${layout} without a controlled host`);
  }
  return { orientation, layout, sizes: PANELS_LAYOUTS[layout], controlled, accepts };
};

const separatorIndex = (target: string | undefined): number => {
  const match = /^separator:(\d+)$/.exec(target ?? "separator:0");
  if (match === null) {
    throw new Unsupported(`part ${target ?? ""}`);
  }
  const index = Number(match[1]);
  if (index < 0 || index >= PANEL_COUNT - 1) {
    throw new Unsupported(`separator ${index}`);
  }
  return index;
};

const HOST_EVENTS: Readonly<Record<PanelsLayout, string>> = {
  initial: "hostEqual", // never reached: setup skips the initial layout
  equal: "hostEqual",
  wide: "hostWide",
  narrow: "hostNarrow",
  collapsed: "hostCollapsed",
};

const KEY_EVENTS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  Enter: "enter",
} as const;

type KeyEvent = keyof typeof KEY_EVENTS;

const isKeyEvent = (key: string): key is KeyEvent => key in KEY_EVENTS;

/**
 * Resizable panels vocabulary <-> `specs/patterns/resizable-panels.qnt`. Parts:
 * `separator:0` / `separator:1` and `pane:0..2`; keys only act on the focused
 * separator (focus it first, as a user would). The drag is its own vocabulary
 * (`dragStart` on a separator, `dragBy` with a ±10 delta, `dragEnd`), so the
 * spec's snapshot + delta model and the DOM's real pointer events see the same
 * steps. `hostLayout` is the host writing a whole layout (controlled only).
 */
export const resizablePanelsBridge: SpecBridge = {
  setup: (config) => {
    const c = resizablePanelsConfig(config);
    const events: QuintEvent[] = [];
    if (c.orientation === "horizontal") {
      events.push(specEvent("orientHorizontal"));
    }
    if (c.controlled) {
      events.push(specEvent("control"));
      if (c.accepts) {
        events.push(specEvent("acceptRequests"));
      }
      if (c.layout !== "initial") {
        events.push(specEvent(HOST_EVENTS[c.layout]));
      }
    }
    return events;
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        return [specEvent(`focusSep${separatorIndex(step.target)}`)];
      case "blur":
        return [specEvent("blur")];
      case "key": {
        const key = step.key ?? "";
        if (!isKeyEvent(key)) {
          throw new Unsupported(`key ${key}`);
        }
        return [specEvent(KEY_EVENTS[key])];
      }
      case "dragStart":
        return [specEvent(`dragDown${separatorIndex(step.target)}`)];
      case "dragBy": {
        const delta = step.value;
        if (delta === 10) {
          return [specEvent("dragNext")];
        }
        if (delta === -10) {
          return [specEvent("dragPrev")];
        }
        throw new Unsupported(`drag delta ${JSON.stringify(delta)}`);
      }
      case "dragEnd":
      case "dragCancel":
        return [specEvent("dragUp")];
      case "hover":
      case "unhover":
        return [];
      case "prop":
        switch (step.prop) {
          case "orientation":
            if (step.value === "horizontal") {
              return [specEvent("orientHorizontal")];
            }
            if (step.value === "vertical") {
              return [specEvent("orientVertical")];
            }
            throw new Unsupported(`orientation ${JSON.stringify(step.value)}`);
          case "hostLayout": {
            if (!isLayout(step.value)) {
              throw new Unsupported(`layout ${JSON.stringify(step.value)}`);
            }
            if (step.value === "initial") {
              throw new Unsupported("layout initial is not a host write");
            }
            return [specEvent(HOST_EVENTS[step.value])];
          }
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => [num(state["s0"]), num(state["s1"]), num(state["s2"])],
  focus: (state) => {
    switch (state["focus"]) {
      case "sep0":
        return "separator:0";
      case "sep1":
        return "separator:1";
      default:
        return null;
    }
  },
  attr: (state, target, name) => {
    const index = separatorIndex(target);
    switch (name) {
      case "role":
        return "separator";
      case "aria-orientation":
        return state["o"] === "horizontal" ? "horizontal" : "vertical";
      case "aria-valuenow":
        return String(num(state[`s${index}`]));
      case "aria-valuemin":
        return String(PANEL_MIN);
      case "aria-valuemax":
        return String(PANEL_MAX);
      case "tabindex":
        return "0";
      default:
        throw new Unsupported(`attribute ${name} on ${target}`);
    }
  },
  visible: () => [],
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onSizesChange", [num(after["rq0"]), num(after["rq1"]), num(after["rq2"])]] as const],
};

/** The user-level steps a differential walk draws from. */
export const resizablePanelsSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "separator:0" },
  { event: "focus", target: "separator:1" },
  { event: "blur", target: "separator:0" },
  { event: "key", key: "ArrowLeft", target: "separator:0" },
  { event: "key", key: "ArrowRight", target: "separator:1" },
  { event: "key", key: "ArrowUp", target: "separator:0" },
  { event: "key", key: "ArrowDown", target: "separator:1" },
  { event: "key", key: "Home", target: "separator:0" },
  { event: "key", key: "End", target: "separator:1" },
  { event: "key", key: "Enter", target: "separator:0" },
  { event: "key", key: "Enter", target: "separator:1" },
  { event: "prop", prop: "orientation", value: "horizontal" },
  { event: "prop", prop: "orientation", value: "vertical" },
  { event: "prop", prop: "hostLayout", value: "wide" },
  { event: "prop", prop: "hostLayout", value: "narrow" },
  { event: "prop", prop: "hostLayout", value: "collapsed" },
  { event: "prop", prop: "hostLayout", value: "equal" },
  { event: "dragStart", target: "separator:0" },
  { event: "dragStart", target: "separator:1" },
  { event: "dragBy", value: 10 },
  { event: "dragBy", value: -10 },
  { event: "dragEnd" },
];

export const resizablePanelsProbe: Probe = {
  attrs: [
    ["separator:0", "role"],
    ["separator:0", "aria-orientation"],
    ["separator:0", "aria-valuenow"],
    ["separator:0", "aria-valuemin"],
    ["separator:0", "aria-valuemax"],
    ["separator:0", "tabindex"],
    ["separator:1", "aria-valuenow"],
  ],
  events: ["onSizesChange"],
};
