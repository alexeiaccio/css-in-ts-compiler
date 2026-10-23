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

const num = (value: QuintModelValue[string] | undefined): number =>
  typeof value === "bigint" ? Number(value) : -1;

/** The spec's fixed corpus; the differential walk mounts exactly these. */
export const COMBOBOX_SELECT_ONLY_ITEMS: ReadonlyArray<string> = [
  "Apple",
  "Banana",
  "Blueberry",
  "Cherry",
  "Cranberry",
  "Durian",
];

/** Scenario config -> what both targets are mounted with. */
export interface ComboboxSelectOnlyConfig {
  readonly items: ReadonlyArray<string>;
  /** Index into `items`, or `null` for no selection. */
  readonly selected: number | null;
  readonly open: boolean;
  readonly autoFocus: boolean;
  /** The host owns (value, open) (`value`/`open` props present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned value the host holds (rejects every request). */
  readonly pinned: number | null;
}

const indexIn = (items: ReadonlyArray<string>, value: Schema.Json): number => {
  if (typeof value !== "string") {
    throw new Unsupported(`selected ${JSON.stringify(value)}`);
  }
  const index = items.indexOf(value);
  if (index < 0) {
    throw new Unsupported(`selected ${value} is not one of the items`);
  }
  return index;
};

export const comboboxSelectOnlyConfig = (config: ScenarioConfig): ComboboxSelectOnlyConfig => {
  let items: ReadonlyArray<string> = COMBOBOX_SELECT_ONLY_ITEMS;
  let selected: number | null = null;
  let open = false;
  let autoFocus = false;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "variant":
        if (value !== "select-only") {
          throw new Unsupported(`variant ${JSON.stringify(value)}`);
        }
        break;
      case "items":
        if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
          items = value;
        } else {
          throw new Unsupported(`items ${JSON.stringify(value)}`);
        }
        break;
      case "defaultSelectedValue":
      case "defaultValue":
      case "defaultSelectedKey":
        selected = value === null ? null : indexIn(items, value);
        break;
      case "defaultOpen":
        if (typeof value !== "boolean") {
          throw new Unsupported(`defaultOpen ${JSON.stringify(value)}`);
        }
        open = value;
        break;
      case "autoFocus":
        if (typeof value !== "boolean") {
          throw new Unsupported(`autoFocus ${JSON.stringify(value)}`);
        }
        autoFocus = value;
        break;
      case "controlled":
        if (typeof value !== "boolean") {
          throw new Unsupported(`controlled ${JSON.stringify(value)}`);
        }
        controlled ||= value;
        break;
      case "value":
        // a pinned value makes the host reject every request (react-aria isX)
        pinned = value === null ? null : indexIn(items, value);
        controlled = true;
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return {
    items,
    selected,
    open,
    autoFocus,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

type Part = "combobox" | "popup" | "option";

const partOf = (target: string | undefined): Part => {
  const name = (target ?? "input").replace(/:\d+$/, "");
  if (name === "input" || name === "combobox" || name === "trigger") {
    return "combobox";
  }
  if (name === "popup" || name === "listbox") {
    return "popup";
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

/** A printable character -> the spec's typeahead letter pool (`9` = no match). */
const charLetter = (char: string): bigint => {
  switch (char.toLowerCase()) {
    case "a":
      return 0n;
    case "b":
      return 1n;
    case "c":
      return 2n;
    case "d":
      return 3n;
    default:
      return 9n;
  }
};

// `stateOf` in the spec: injective for value -1..5 and the open bit.
const openOf = (state: number): boolean => state % 2 === 1;
const valueOf = (state: number): number => Math.floor(state / 2) - 1;

const programmatic = (
  prop: string | undefined,
  value: Schema.Json | undefined,
): ReadonlyArray<QuintEvent> => {
  switch (prop) {
    case "setValue": {
      const index = typeof value === "number" ? value : -1;
      if (!Number.isInteger(index) || index < 0 || index >= COMBOBOX_SELECT_ONLY_ITEMS.length) {
        throw new Unsupported(`setValue ${JSON.stringify(value)}`);
      }
      return [specEvent("set_value", { i: BigInt(index) })];
    }
    case "setOpen":
      return [specEvent("setOpen", { o: value === true })];
    case "hostToggle":
      return [specEvent("hostToggle")];
    default:
      throw new Unsupported(`prop ${prop ?? ""}`);
  }
};

const focusEvent = specEvent("focus");

export const comboboxSelectOnlyBridge: SpecBridge = {
  setup: (config) => {
    const { selected, open, controlled, accepts, pinned } = comboboxSelectOnlyConfig(config);
    if (controlled) {
      const initial = pinned ?? selected;
      return [
        specEvent("control"),
        ...(initial === null ? [] : [specEvent("set_value", { i: BigInt(initial) })]),
        ...(open ? [specEvent("setOpen", { o: true })] : []),
        ...(accepts ? [specEvent("acceptRequests")] : []),
      ];
    }
    return [
      ...(selected === null ? [] : [specEvent("set_value", { i: BigInt(selected) })]),
      // opening requires DOM focus; click focuses the combobox and opens it
      ...(open ? [specEvent("click_combobox")] : []),
    ];
  },
  event: (step: ActionStep) => {
    if (step.event === "prop") {
      return programmatic(step.prop, step.value);
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
        if (part === "combobox") {
          return [specEvent("click_combobox")];
        }
        if (part === "option") {
          return [specEvent("click_option", { i: BigInt(optionIndex(step.target)) })];
        }
        throw new Unsupported(`click on ${step.target}`);
      }
      case "key": {
        if (step.repeat === true) {
          throw new Unsupported("repeat");
        }
        const key = step.key ?? "";
        if (key.length === 1 && key !== " ") {
          return [focusEvent, specEvent("type_char", { ch: charLetter(key) })];
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
          case "Home":
            return [focusEvent, specEvent("home")];
          case "End":
            return [focusEvent, specEvent("end")];
          case "PageUp":
            return [focusEvent, specEvent("page_up")];
          case "PageDown":
            return [focusEvent, specEvent("page_down")];
          case "Enter":
            return [focusEvent, specEvent("enter")];
          case " ":
          case "Space":
            return [focusEvent, specEvent("space")];
          case "Escape":
            return [focusEvent, specEvent("escape")];
          case "Tab":
            return [focusEvent, specEvent("tab")];
          default:
            throw new Unsupported(`key ${JSON.stringify(key)}`);
        }
      }
      case "prop":
        return programmatic(step.prop, step.value);
      case "hover":
      case "unhover":
        throw new Unsupported(`event ${step.event}`);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => num(state["value"]),
  focus: (state) => (state["focused"] === true ? "input" : null),
  attr: (state, target, name) => {
    const part = partOf(target);
    const open = state["open"] === true;
    const active = num(state["active"]);
    if (part === "combobox") {
      if (name === "aria-expanded") {
        return String(open);
      }
      if (name === "aria-activedescendant") {
        return open && active >= 0 ? `option:${active}` : null;
      }
      if (name === "aria-autocomplete") {
        return "list";
      }
    } else if (part === "option" && name === "aria-selected") {
      return String(open && active === optionIndex(target));
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) =>
    state["open"] === true
      ? ["popup", ...COMBOBOX_SELECT_ONLY_ITEMS.map((_, index) => `option:${index}`)]
      : [],
  events: (before, after) => {
    if (before["requests"] === after["requests"]) {
      return [];
    }
    const base = num(after["base"]);
    const requested = num(after["requested"]);
    const out: Array<readonly [string, Schema.Json]> = [];
    if (openOf(base) !== openOf(requested)) {
      out.push(["onOpenChange", openOf(requested)]);
    }
    if (valueOf(base) !== valueOf(requested)) {
      out.push(["onValueChange", valueOf(requested)]);
    }
    return out;
  },
};

/** The user-level steps the differential walk draws from. */
export const comboboxSelectOnlySteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "input" },
  { event: "click", target: "input" },
  { event: "key", key: "ArrowDown", target: "input" },
  { event: "key", key: "ArrowUp", target: "input" },
  { event: "key", key: "Home", target: "input" },
  { event: "key", key: "End", target: "input" },
  { event: "key", key: "PageUp", target: "input" },
  { event: "key", key: "PageDown", target: "input" },
  { event: "key", key: "Enter", target: "input" },
  { event: "key", key: " ", target: "input" },
  { event: "key", key: "Escape", target: "input" },
  { event: "key", key: "Tab", target: "input" },
  { event: "key", key: "a", target: "input" },
  { event: "key", key: "b", target: "input" },
  { event: "key", key: "c", target: "input" },
  { event: "key", key: "d", target: "input" },
  { event: "key", key: "z", target: "input" },
  { event: "prop", prop: "setValue", value: 3 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "setOpen", value: true },
  { event: "prop", prop: "setOpen", value: false },
  { event: "prop", prop: "hostToggle" },
];

export const comboboxSelectOnlyProbe: Probe = {
  attrs: [
    ["input", "aria-expanded"],
    ["input", "aria-activedescendant"],
    ["input", "aria-autocomplete"],
    ["option:0", "aria-selected"],
    ["option:1", "aria-selected"],
  ],
  events: ["onOpenChange"],
};
