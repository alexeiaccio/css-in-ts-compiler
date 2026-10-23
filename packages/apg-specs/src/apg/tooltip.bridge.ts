import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, boolean | bigint | string> = {},
): QuintEvent => ({ _tag: tag, ...params });

/**
 * Scenario `config` -> mount options. The spec models timers as events, so the
 * ported scenarios that `wait` for a real timer cannot be replayed (the shared
 * DOM driver has no clock); `delay` here only selects whether focus / hover open
 * immediately, which is what the delay-free scenarios assert.
 *
 * `controlled` puts the visible tooltip in a host; `open` is the initial value
 * (tooltip 0) and `accepts` (default true) says whether the host writes every
 * request back. The spec's value is 0 none / 1 tooltip a / 2 tooltip b.
 */
export interface TooltipConfig {
  readonly delay: number | undefined;
  readonly closeDelay: number;
  readonly disabled: boolean;
  readonly defaultOpen: boolean;
  readonly controlled: boolean;
  readonly open: boolean;
  readonly accepts: boolean;
}

export const tooltipConfig = (config: ScenarioConfig): TooltipConfig => {
  let delay: number | undefined;
  let closeDelay = 0;
  let disabled = false;
  let defaultOpen = false;
  let controlled = false;
  let open = false;
  let accepts = true;
  for (const [key, raw] of Object.entries(config)) {
    if (key === "delay" && typeof raw === "number") {
      delay = raw;
    } else if (key === "closeDelay" && typeof raw === "number") {
      closeDelay = raw;
    } else if (key === "defaultOpen" && typeof raw === "boolean") {
      defaultOpen = raw;
    } else if (key === "controlled" && typeof raw === "boolean") {
      controlled ||= raw;
    } else if (key === "open" && typeof raw === "boolean") {
      open = raw;
      controlled = true;
    } else if (key === "accepts" && typeof raw === "boolean") {
      accepts = raw;
    } else if (key === "instant" && raw === true) {
      delay = 0;
    } else if (key === "disabled" && typeof raw === "boolean") {
      disabled = raw;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return {
    delay,
    closeDelay,
    disabled,
    defaultOpen,
    controlled,
    open,
    accepts: controlled && accepts,
  };
};

const PART = /^trigger:(\d)$/;
const TIP = /^tooltip:(\d)$/;
const letterOf = (index: number): string => (index === 1 ? "b" : "a");

/** Only the two-trigger shape the spec models is accepted. */
const triggerIndex = (target: string | undefined): number => {
  if (target === undefined) {
    throw new Unsupported("missing target");
  }
  if (target === "trigger") {
    return 0;
  }
  const match = PART.exec(target);
  if (match !== null) {
    return Number(match[1]);
  }
  throw new Unsupported(`part ${target}`);
};

const num = (value: QuintModelValue[string] | undefined): number =>
  value === undefined ? 0 : Number(value);

/**
 * Tooltip vocabulary <-> `specs/apg/tooltip.qnt`. Parts: `trigger:0`/`trigger:1`
 * and their `tooltip:0`/`tooltip:1`. Timers are driven as `prop` steps
 * (`showTimerA`, `hideTimer`, `warmExpire`, ...) — the spec models them as
 * events, not clocks. `wait` and other timer-dependent steps are `Unsupported`.
 *
 * `controlled` puts the visible tooltip in a host; `setValue` / `hostToggle` are
 * the host writing it.
 */
export const tooltipBridge: SpecBridge = {
  setup: (config) => {
    const c = tooltipConfig(config);
    if (!c.controlled) {
      return [];
    }
    return [
      specEvent("control"),
      ...(c.accepts ? [specEvent("acceptRequests")] : []),
      ...(c.open ? [specEvent("setValue", { v: 1n })] : []),
    ];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focusIn", { t: letterOf(triggerIndex(step.target)) })];
      case "blur":
        return [specEvent("focusOut")];
      case "hover": {
        const tip = TIP.exec(step.target ?? "");
        if (tip !== null) {
          return [specEvent("pointerEnterTip")];
        }
        return [
          specEvent("pointerEnter", {
            t: letterOf(triggerIndex(step.target)),
          }),
        ];
      }
      case "unhover":
        return [specEvent("pointerLeave"), specEvent("hideTimer")];
      case "key":
        if (step.key === "Escape") {
          return [specEvent("escape")];
        }
        throw new Unsupported(`key ${step.key ?? ""}`);
      case "prop":
        switch (step.prop) {
          case "pointerEnterA":
            return [specEvent("pointerEnter", { t: "a" })];
          case "pointerEnterB":
            return [specEvent("pointerEnter", { t: "b" })];
          case "focusA":
            return [specEvent("focusOut"), specEvent("focusIn", { t: "a" })];
          case "focusB":
            return [specEvent("focusOut"), specEvent("focusIn", { t: "b" })];
          case "pointerLeave":
            return [specEvent("pointerLeave"), specEvent("hideTimer")];
          case "pointerEnterTip":
            return [specEvent("pointerEnterTip")];
          case "showTimerA":
            return [specEvent("showTimer", { t: "a" })];
          case "showTimerB":
            return [specEvent("showTimer", { t: "b" })];
          case "hideTimer":
            return [specEvent("hideTimer")];
          case "warmExpire":
            return [specEvent("warmExpire")];
          case "escape":
            return [specEvent("escape")];
          case "blur":
            return [specEvent("focusOut")];
          case "setWarmup":
            return [specEvent("setWarmup", { on: step.value === true })];
          case "setValue":
            return [specEvent("setValue", { v: BigInt(Number(step.value)) })];
          case "hostToggle":
            return [specEvent("hostToggle")];
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state: QuintModelValue) =>
    state["shownA"] === true ? 1 : state["shownB"] === true ? 2 : 0,
  focus: (state: QuintModelValue) => {
    if (state["focus"] === "a") {
      return "trigger:0";
    }
    if (state["focus"] === "b") {
      return "trigger:1";
    }
    return null;
  },
  attr: (state: QuintModelValue, target: string, name: string) => {
    const tip = TIP.exec(target);
    if (tip !== null) {
      if (name === "role") {
        return "tooltip";
      }
      throw new Unsupported(`attribute ${name} on ${target}`);
    }
    const trigger = PART.exec(target);
    if (trigger !== null) {
      if (name === "aria-describedby") {
        const index = Number(trigger[1]);
        const described = index === 0 ? state["describedA"] === true : state["describedB"] === true;
        return described ? `tooltip:${index}` : null;
      }
      throw new Unsupported(`attribute ${name} on ${target}`);
    }
    throw new Unsupported(`part ${target}`);
  },
  visible: (state: QuintModelValue) => [
    ...(state["shownA"] === true ? ["tooltip:0"] : []),
    ...(state["shownB"] === true ? ["tooltip:1"] : []),
  ],
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onOpenChange", num(after["requested"]) > 0] as const],
};

/** The user-level steps a differential walk draws from. */
export const tooltipSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "focusA" },
  { event: "prop", prop: "focusB" },
  { event: "prop", prop: "blur" },
  { event: "prop", prop: "pointerEnterA" },
  { event: "prop", prop: "pointerEnterB" },
  { event: "prop", prop: "pointerLeave" },
  { event: "prop", prop: "pointerEnterTip" },
  { event: "prop", prop: "showTimerA" },
  { event: "prop", prop: "showTimerB" },
  { event: "prop", prop: "hideTimer" },
  { event: "prop", prop: "warmExpire" },
  { event: "prop", prop: "setWarmup", value: true },
  { event: "prop", prop: "setWarmup", value: false },
  { event: "prop", prop: "escape" },
  { event: "prop", prop: "setValue", value: 1 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "hostToggle" },
];

export const tooltipProbe: Probe = {
  attrs: [
    ["trigger:0", "aria-describedby"],
    ["trigger:1", "aria-describedby"],
    ["tooltip:0", "role"],
    ["tooltip:1", "role"],
  ],
  events: ["onOpenChange"],
};
