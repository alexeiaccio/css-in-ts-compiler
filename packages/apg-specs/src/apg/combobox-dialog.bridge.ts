import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number =>
  typeof value === "bigint" ? Number(value) : -1;

export interface ComboboxDialogConfig {
  /** A valid date in the spec's calendar, or `null`. */
  readonly value: number | null;
  /** The host owns the date value (`value` prop present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned date the host holds (rejects every request). */
  readonly pinned: number | null;
}

const VALUE_POOL = new Set([0, 59, 134, 266, -1]);

export const comboboxDialogConfig = (config: ScenarioConfig): ComboboxDialogConfig => {
  let value: number | null = null;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value_] of Object.entries(config)) {
    if ((key === "value" || key === "defaultValue") && typeof value_ === "number") {
      if (!VALUE_POOL.has(value_)) {
        throw new Unsupported(`${key} ${value_} outside the date pool`);
      }
      value = value_;
      if (key === "value") {
        pinned = value_;
        controlled = true;
      }
    } else if (key === "controlled" && typeof value_ === "boolean") {
      controlled ||= value_;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value_)}`);
    }
  }
  return { value, controlled, accepts: controlled && pinned === null, pinned };
};

const partOf = (target: string | undefined): "combobox" | "dialog" => {
  const name = (target ?? "input").replace(/:\d+$/, "");
  if (name === "input" || name === "combobox") {
    return "combobox";
  }
  if (name === "dialog" || name === "popup" || name === "trigger" || name === "button") {
    return "dialog";
  }
  throw new Unsupported(`part ${name}`);
};

const focusEvent = specEvent("focus");

export const comboboxDialogBridge: SpecBridge = {
  setup: (config) => {
    const { value, controlled, accepts, pinned } = comboboxDialogConfig(config);
    const events: Array<QuintEvent> = [];
    if (controlled) {
      events.push(specEvent("control"));
      const initial = pinned ?? value;
      if (initial !== null && initial >= 0) {
        events.push(specEvent("set_value", { k: BigInt(initial) }));
      }
      if (accepts) {
        events.push(specEvent("acceptRequests"));
      }
    } else if (value !== null) {
      events.push(specEvent("set_value", { k: BigInt(value) }));
    }
    return events;
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focus")];
      case "blur":
        return [specEvent("blur")];
      case "click":
        return partOf(step.target) === "dialog"
          ? [specEvent("click_button")]
          : [specEvent("focus")];
      case "key": {
        if (step.repeat === true) {
          throw new Unsupported("repeat");
        }
        const key = step.key ?? "";
        if (key.length === 1 && key !== " ") {
          return [focusEvent, specEvent("type_text", { k: 59n })];
        }
        switch (key) {
          case "ArrowDown":
            return [focusEvent, specEvent("arrow_down")];
          case "ArrowUp":
            return [focusEvent, specEvent("arrow_up")];
          case "Alt+ArrowDown":
            return [focusEvent, specEvent("alt_arrow_down")];
          case "ArrowLeft":
            return [focusEvent, specEvent("arrow_left")];
          case "ArrowRight":
            return [focusEvent, specEvent("arrow_right")];
          case "Home":
            return [focusEvent, specEvent("home")];
          case "End":
            return [focusEvent, specEvent("end")];
          case "PageUp":
            return [focusEvent, specEvent("page_up")];
          case "PageDown":
            return [focusEvent, specEvent("page_down")];
          case "Shift+PageUp":
            return [focusEvent, specEvent("shift_page_up")];
          case "Shift+PageDown":
            return [focusEvent, specEvent("shift_page_down")];
          case "Enter":
            return [focusEvent, specEvent("enter")];
          case " ":
          case "Space":
            return [focusEvent, specEvent("space")];
          case "Escape":
            return [focusEvent, specEvent("escape")];
          case "Tab":
            return [focusEvent, specEvent("tab")];
          case "Shift+Tab":
            return [focusEvent, specEvent("shift_tab")];
          default:
            throw new Unsupported(`key ${JSON.stringify(key)}`);
        }
      }
      case "type": {
        const text = step.text ?? "";
        if (text.length < 1) {
          throw new Unsupported(`type ${JSON.stringify(text)}`);
        }
        return [focusEvent, specEvent("type_text", { k: 59n })];
      }
      case "prop": {
        if (step.prop === "setValue" && typeof step.value === "number") {
          if (!VALUE_POOL.has(step.value)) {
            throw new Unsupported(`setValue ${step.value}`);
          }
          return [specEvent("set_value", { k: BigInt(step.value) })];
        }
        if (step.prop === "hostToggle") {
          return [specEvent("hostToggle")];
        }
        throw new Unsupported(`prop ${step.prop ?? ""}`);
      }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => ({
    open: state["open"] === true,
    value: num(state["value"]),
  }),
  focus: (state) => {
    const domFocus = num(state["domFocus"]);
    if (state["open"] !== true) {
      return domFocus === 1 ? "input" : null;
    }
    return domFocus >= 2 ? "dialog" : null;
  },
  attr: (state, target, name) => {
    const open = state["open"] === true;
    if (partOf(target) === "combobox") {
      if (name === "aria-haspopup") {
        return "dialog";
      }
      if (name === "aria-autocomplete") {
        return "none";
      }
      if (name === "aria-expanded") {
        return String(open);
      }
      if (name === "aria-activedescendant") {
        return null;
      }
    } else if (name === "aria-modal") {
      return String(open);
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) => (state["open"] === true ? ["popup", "dialog"] : []),
  events: (before, after) => {
    const out: Array<readonly [string, Schema.Json]> = [];
    if (before["open"] !== after["open"]) {
      out.push(["onOpenChange", after["open"] === true]);
    }
    if (before["requests"] !== after["requests"]) {
      out.push(["onValueChange", num(after["requested"])]);
    }
    return out;
  },
};

export const comboboxDialogSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "input" },
  { event: "blur", target: "input" },
  { event: "click", target: "trigger" },
  { event: "key", key: "ArrowDown", target: "input" },
  { event: "key", key: "Alt+ArrowDown", target: "input" },
  { event: "key", key: "ArrowUp", target: "input" },
  { event: "key", key: "ArrowLeft", target: "input" },
  { event: "key", key: "ArrowRight", target: "input" },
  { event: "key", key: "Home", target: "input" },
  { event: "key", key: "End", target: "input" },
  { event: "key", key: "PageUp", target: "input" },
  { event: "key", key: "PageDown", target: "input" },
  { event: "key", key: "Shift+PageUp", target: "input" },
  { event: "key", key: "Shift+PageDown", target: "input" },
  { event: "key", key: "Enter", target: "input" },
  { event: "key", key: " ", target: "input" },
  { event: "key", key: "Escape", target: "input" },
  { event: "key", key: "Tab", target: "input" },
  { event: "key", key: "Shift+Tab", target: "input" },
  { event: "key", key: "a", target: "input" },
  { event: "prop", prop: "setValue", value: 59 },
  { event: "prop", prop: "setValue", value: 134 },
  { event: "prop", prop: "hostToggle" },
];

export const comboboxDialogProbe: Probe = {
  attrs: [
    ["input", "aria-haspopup"],
    ["input", "aria-autocomplete"],
    ["input", "aria-expanded"],
    ["input", "aria-activedescendant"],
    ["dialog", "aria-modal"],
  ],
  events: ["onOpenChange"],
};
