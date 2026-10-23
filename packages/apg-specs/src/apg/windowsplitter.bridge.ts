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

export type SplitterOrientation = "vertical" | "horizontal";

/**
 * Scenario `config` -> what both targets are mounted with. The spec hard-codes
 * MIN=0, MAX=6, STEP=2, so any other range/step is not modelled; `value` must be
 * reachable from the spec's INITIAL=4 by whole steps. `prev` is remembered by the
 * spec itself at the moment of collapse, never configured.
 *
 * `controlled` puts `value` in a host: the host answers every request
 * (`accepts`, the default) or ignores them all (`accepts: false`, a pinned value).
 */
export interface WindowsplitterConfig {
  readonly orientation: SplitterOrientation;
  readonly fixed: boolean;
  readonly value: number;
  readonly collapsed: boolean;
  readonly labelledby: string | null;
  readonly controlled: boolean;
  readonly accepts: boolean;
}

const MIN = 0;
const MAX = 6;
const STEP = 2;
const INITIAL = 4;

export const windowsplitterConfig = (config: ScenarioConfig): WindowsplitterConfig => {
  let orientation: SplitterOrientation = "vertical";
  let fixed = false;
  let value = INITIAL;
  let collapsed = false;
  let labelledby: string | null = null;
  let controlled = false;
  let accepts = true;
  for (const [key, raw] of Object.entries(config)) {
    if (key === "orientation" && (raw === "vertical" || raw === "horizontal")) {
      orientation = raw;
    } else if (key === "fixed" && typeof raw === "boolean") {
      fixed = raw;
    } else if (key === "value" && typeof raw === "number") {
      value = raw;
    } else if (key === "collapsed" && typeof raw === "boolean") {
      collapsed = raw;
    } else if (key === "controlled" && typeof raw === "boolean") {
      controlled ||= raw;
    } else if (key === "accepts" && typeof raw === "boolean") {
      accepts = raw;
    } else if (key === "labelledby" && (raw === null || typeof raw === "string")) {
      labelledby = raw;
    } else if (key === "min" && raw === MIN) {
      continue;
    } else if (key === "max" && raw === MAX) {
      continue;
    } else if (key === "step" && raw === STEP) {
      continue;
    } else if (key === "prev" && typeof raw === "number") {
      // remembered at collapse; the spec chooses it, the config only hints
      continue;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  if (value < MIN || value > MAX || value % STEP !== 0) {
    throw new Unsupported(`value ${value}`);
  }
  return {
    orientation,
    fixed,
    value,
    collapsed,
    labelledby,
    controlled,
    accepts: controlled && accepts,
  };
};

const isSeparator = (target: string | undefined): void => {
  const part = (target ?? "separator").replace(/:0$/, "");
  if (part !== "separator") {
    throw new Unsupported(`part ${part}`);
  }
};

const KEY_EVENTS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "home",
  End: "end",
  Enter: "enter",
  F6: "f6",
} as const;

type KeyEvent = keyof typeof KEY_EVENTS;

const isKeyEvent = (key: string): key is KeyEvent => key in KEY_EVENTS;

const valueOf = (value: Schema.Json | undefined): bigint => {
  if (typeof value !== "number") {
    throw new Unsupported(`value ${JSON.stringify(value)}`);
  }
  return BigInt(value);
};

/**
 * Window splitter vocabulary <-> `specs/apg/windowsplitter.qnt`. Parts:
 * `separator` (spec `splitter`) and the `primary` / `secondary` panes the F6
 * cycle focuses. Keys are accepted on any of the three (the spec ignores them
 * unless the splitter has focus); anything else throws `Unsupported`.
 *
 * `controlled` puts `value` in a host; `setValue` / `hostToggle` are the host
 * writing it (inert while uncontrolled).
 */
export const windowsplitterBridge: SpecBridge = {
  setup: (config) => {
    const c = windowsplitterConfig(config);
    const events: QuintEvent[] = [];
    if (c.orientation === "horizontal") {
      events.push(specEvent("orientHorizontal"));
    }
    if (c.controlled) {
      events.push(specEvent("control"));
      if (c.accepts) {
        events.push(specEvent("acceptRequests"));
      }
      events.push(specEvent("setValue", { v: BigInt(c.value) }));
    } else if (c.value !== INITIAL) {
      // move to the configured value by whole steps from INITIAL; focusing first
      // is what makes the arrows act (the walk only uses value == INITIAL, so it
      // never focuses during setup and stays in sync with the DOM)
      events.push(specEvent("focusSplitter"));
      const key = c.value < INITIAL ? "left" : "right";
      for (let i = 0; i < Math.abs(c.value - INITIAL) / STEP; i += 1) {
        events.push(specEvent(key));
      }
    }
    if (c.fixed) {
      events.push(specEvent("makeFixed"));
    }
    return events;
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        isSeparator(step.target);
        return [specEvent("focusSplitter")];
      case "blur":
        return [specEvent("blur")];
      case "key": {
        const key = step.key ?? "";
        if (!isKeyEvent(key)) {
          throw new Unsupported(`key ${key}`);
        }
        return [specEvent(KEY_EVENTS[key])];
      }
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
          case "fixed":
            return [specEvent(step.value === false ? "makeResizable" : "makeFixed")];
          case "makeFixed":
            return [specEvent("makeFixed")];
          case "makeResizable":
            return [specEvent("makeResizable")];
          case "cycleFocus":
            return [specEvent("f6")];
          case "setValue":
            return [specEvent("setValue", { v: valueOf(step.value) })];
          case "hostToggle":
            return [specEvent("hostToggle")];
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => num(state["value"]),
  focus: (state) => {
    switch (state["focus"]) {
      case "splitter":
        return "separator";
      case "primary":
        return "primary";
      case "secondary":
        return "secondary";
      default:
        return null;
    }
  },
  attr: (state, target, name) => {
    isSeparator(target);
    switch (name) {
      case "role":
        return "separator";
      case "aria-orientation":
        return state["orientation"] === "horizontal" ? "horizontal" : "vertical";
      case "aria-valuenow":
        return String(state["ariaNow"]);
      case "aria-valuemin":
        return String(MIN);
      case "aria-valuemax":
        return String(MAX);
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
      : [["onValueChange", num(after["requested"])] as const],
};

/** The user-level steps a differential walk draws from. */
export const windowsplitterSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "separator" },
  { event: "blur", target: "separator" },
  { event: "key", key: "ArrowLeft", target: "separator" },
  { event: "key", key: "ArrowRight", target: "separator" },
  { event: "key", key: "ArrowUp", target: "separator" },
  { event: "key", key: "ArrowDown", target: "separator" },
  { event: "key", key: "Home", target: "separator" },
  { event: "key", key: "End", target: "separator" },
  { event: "key", key: "Enter", target: "separator" },
  { event: "key", key: "F6", target: "separator" },
  { event: "prop", prop: "cycleFocus" },
  { event: "prop", prop: "orientation", value: "horizontal" },
  { event: "prop", prop: "orientation", value: "vertical" },
  { event: "prop", prop: "fixed", value: true },
  { event: "prop", prop: "fixed", value: false },
  { event: "prop", prop: "setValue", value: 6 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "hostToggle" },
];

export const windowsplitterProbe: Probe = {
  attrs: [
    ["separator", "role"],
    ["separator", "aria-orientation"],
    ["separator", "aria-valuenow"],
    ["separator", "aria-valuemin"],
    ["separator", "aria-valuemax"],
    ["separator", "tabindex"],
  ],
  events: ["onValueChange"],
};
