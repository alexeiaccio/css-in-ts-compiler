import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { ComboboxSelectOnlyConfig } from "./combobox-select-only.bridge";
import type { Schema } from "effect";

// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintModelValue[string] | undefined): number =>
  typeof value === "bigint" ? Number(value) : -1;

/** The spec's fixed corpus (Alabama…Delaware), used when no items are supplied. */
export const COMBOBOX_AUTOCOMPLETE_ITEMS: ReadonlyArray<string> = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Colorado",
  "Connecticut",
  "Delaware",
];

export interface ComboboxAutocompleteConfig extends ComboboxSelectOnlyConfig {
  /** aria-autocomplete: 0 none, 1 list, 2 both. */
  readonly mode: 0 | 1 | 2;
}

const modeOf = (value: Schema.Json): 0 | 1 | 2 => {
  if (value === 0 || value === 1 || value === 2) {
    return value;
  }
  if (value === "none") {
    return 0;
  }
  if (value === "list") {
    return 1;
  }
  if (value === "both") {
    return 2;
  }
  throw new Unsupported(`mode ${JSON.stringify(value)}`);
};

export const comboboxAutocompleteConfig = (config: ScenarioConfig): ComboboxAutocompleteConfig => {
  let mode: 0 | 1 | 2 = 1;
  let items: ReadonlyArray<string> = COMBOBOX_AUTOCOMPLETE_ITEMS;
  let selected: number | null = null;
  let open = false;
  let autoFocus = false;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    if (key === "autoComplete" || key === "mode") {
      mode = modeOf(value);
    } else if (key === "items") {
      if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        items = value;
      } else {
        throw new Unsupported(`items ${JSON.stringify(value)}`);
      }
    } else if (
      key === "defaultValue" ||
      key === "defaultSelectedValue" ||
      key === "defaultSelectedKey"
    ) {
      if (value === null) {
        selected = null;
      } else if (typeof value === "string") {
        const index = items.indexOf(value);
        if (index < 0) {
          throw new Unsupported(`selected ${value} is not one of the items`);
        }
        selected = index;
      } else {
        throw new Unsupported(`${key} ${JSON.stringify(value)}`);
      }
    } else if (key === "defaultOpen" && typeof value === "boolean") {
      open = value;
    } else if (key === "autoFocus" && typeof value === "boolean") {
      autoFocus = value;
    } else if (key === "controlled" && typeof value === "boolean") {
      controlled ||= value;
    } else if (key === "value") {
      if (value !== null && typeof value !== "string") {
        throw new Unsupported(`value ${JSON.stringify(value)}`);
      }
      pinned = value === null ? null : items.indexOf(value);
      if (pinned !== null && pinned < 0) {
        throw new Unsupported(`value ${value} is not one of the items`);
      }
      controlled = true;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return {
    mode,
    items,
    selected,
    open,
    autoFocus,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

const charIndex = (char: string): bigint => {
  switch (char.toLowerCase()) {
    case "a":
      return 0n;
    case "l":
      return 1n;
    case "r":
      return 2n;
    case "c":
      return 3n;
    case "o":
      return 4n;
    case "d":
      return 5n;
    default:
      return 6n;
  }
};

const partOf = (target: string | undefined): "combobox" | "option" => {
  const name = (target ?? "input").replace(/:\d+$/, "");
  if (name === "input" || name === "combobox" || name === "trigger" || name === "button") {
    return "combobox";
  }
  if (name === "option") {
    return "option";
  }
  throw new Unsupported(`part ${name}`);
};

const optionIndex = (target: string | undefined): number => {
  const match = /^option:(\d+)$/.exec(target ?? "");
  return match?.[1] === undefined ? 0 : Number(match[1]);
};

const focusEvent = specEvent("focus");

export const comboboxAutocompleteBridge: SpecBridge = {
  setup: (config) => {
    const { mode, controlled, accepts, pinned, selected } = comboboxAutocompleteConfig(config);
    const events: Array<QuintEvent> = [];
    if (mode !== 1) {
      events.push(specEvent("set_autocomplete", { m: BigInt(mode) }));
    }
    if (controlled) {
      const initial = pinned ?? selected;
      events.push(specEvent("control"));
      if (initial !== null) {
        events.push(specEvent("set_value", { i: BigInt(initial) }));
      }
      if (accepts) {
        events.push(specEvent("acceptRequests"));
      }
    }
    return events;
  },
  event: (step: ActionStep) => {
    if (step.event === "prop") {
      if (step.prop === "setAutocomplete" && typeof step.value === "number") {
        return [specEvent("set_autocomplete", { m: BigInt(step.value) })];
      }
      if (step.prop === "setValue" && typeof step.value === "number") {
        return [specEvent("set_value", { i: BigInt(step.value) })];
      }
      if (step.prop === "hostToggle") {
        return [specEvent("hostToggle")];
      }
      throw new Unsupported(`prop ${step.prop ?? ""}`);
    }
    if (step.target === undefined) {
      throw new Unsupported(`step ${step.event} without a target`);
    }
    const part = partOf(step.target);
    switch (step.event) {
      case "focus":
        return [specEvent("focus")];
      case "blur":
        return [specEvent("blur")];
      case "click": {
        if (part === "option") {
          return [specEvent("click_option", { i: BigInt(optionIndex(step.target)) })];
        }
        return [specEvent("click_input")];
      }
      case "key": {
        if (step.repeat === true) {
          throw new Unsupported("repeat");
        }
        const key = step.key ?? "";
        if (key.length === 1 && key !== " ") {
          return [focusEvent, specEvent("type_char", { ch: charIndex(key) })];
        }
        switch (key) {
          case "ArrowDown":
            return [focusEvent, specEvent("arrow_down")];
          case "ArrowUp":
            return [focusEvent, specEvent("arrow_up")];
          case "Alt+ArrowDown":
            return [focusEvent, specEvent("alt_arrow_down")];
          case "Alt+ArrowUp":
            return [focusEvent, specEvent("alt_arrow_up")];
          case "ArrowLeft":
            return [focusEvent, specEvent("arrow_left")];
          case "ArrowRight":
            return [focusEvent, specEvent("arrow_right")];
          case "Home":
            return [focusEvent, specEvent("home")];
          case "End":
            return [focusEvent, specEvent("end")];
          case "Enter":
            return [focusEvent, specEvent("enter")];
          case "Escape":
            return [focusEvent, specEvent("escape")];
          case "Tab":
            return [focusEvent, specEvent("tab")];
          case "Backspace":
            return [focusEvent, specEvent("backspace")];
          case "Delete":
            return [focusEvent, specEvent("delete")];
          default:
            throw new Unsupported(`key ${JSON.stringify(key)}`);
        }
      }
      case "type": {
        // the generic DOM driver has no `type` step; typing is driven by single
        // character `key` steps (see the walk alphabet)
        throw new Unsupported(`type ${JSON.stringify(step.text ?? "")}`);
      }
      case "prop": {
        if (step.prop === "setAutocomplete" && typeof step.value === "number") {
          return [specEvent("set_autocomplete", { m: BigInt(step.value) })];
        }
        if (step.prop === "setValue" && typeof step.value === "number") {
          return [specEvent("set_value", { i: BigInt(step.value) })];
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
    mode: num(state["mode"]),
    open: state["open"] === true,
    text: num(state["text"]),
    picked: num(state["picked"]),
    active: num(state["active"]),
  }),
  focus: (state) => (state["focused"] === true ? "input" : null),
  attr: (state, target, name) => {
    const part = partOf(target);
    const open = state["open"] === true;
    const active = num(state["active"]);
    const mode = num(state["mode"]);
    if (part === "combobox") {
      if (name === "aria-autocomplete") {
        if (mode === 0) {
          return "none";
        }
        if (mode === 1) {
          return "list";
        }
        return "both";
      }
      if (name === "aria-expanded") {
        return String(open);
      }
      if (name === "aria-activedescendant") {
        return open && active >= 0 ? `option:${active}` : null;
      }
    } else if (name === "aria-selected") {
      return String(open && active === optionIndex(target));
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) =>
    state["open"] === true
      ? ["popup", ...[0, 1, 2, 3, 4, 5].map((index) => `option:${index}`)]
      : [],
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

export const comboboxAutocompleteSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "input" },
  { event: "blur", target: "input" },
  { event: "click", target: "input" },
  { event: "key", key: "ArrowDown", target: "input" },
  { event: "key", key: "ArrowUp", target: "input" },
  { event: "key", key: "Alt+ArrowDown", target: "input" },
  { event: "key", key: "Alt+ArrowUp", target: "input" },
  { event: "key", key: "ArrowLeft", target: "input" },
  { event: "key", key: "ArrowRight", target: "input" },
  { event: "key", key: "Home", target: "input" },
  { event: "key", key: "End", target: "input" },
  { event: "key", key: "Enter", target: "input" },
  { event: "key", key: "Escape", target: "input" },
  { event: "key", key: "Tab", target: "input" },
  { event: "key", key: "Backspace", target: "input" },
  { event: "key", key: "Delete", target: "input" },
  { event: "key", key: "a", target: "input" },
  { event: "key", key: "l", target: "input" },
  { event: "key", key: "r", target: "input" },
  { event: "key", key: "c", target: "input" },
  { event: "key", key: "o", target: "input" },
  { event: "key", key: "d", target: "input" },
  { event: "prop", prop: "setValue", value: 3 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "setAutocomplete", value: 0 },
  { event: "prop", prop: "setAutocomplete", value: 2 },
  { event: "prop", prop: "hostToggle" },
];

export const comboboxAutocompleteProbe: Probe = {
  attrs: [
    ["input", "aria-expanded"],
    ["input", "aria-activedescendant"],
    ["input", "aria-autocomplete"],
    ["option:0", "aria-selected"],
    ["option:1", "aria-selected"],
  ],
  events: ["onOpenChange"],
};
