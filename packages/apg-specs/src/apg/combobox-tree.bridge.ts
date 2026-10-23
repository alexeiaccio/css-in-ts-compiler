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

export interface ComboboxTreeConfig {
  /** 0 all selectable, 1 labels + sticky selection, 2 labels + cleared selection. */
  readonly labelMode: 0 | 1 | 2;
  /** The host owns the picked node (`value` prop present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned node the host holds (rejects every request). */
  readonly pinned: number | null;
}

export const comboboxTreeConfig = (config: ScenarioConfig): ComboboxTreeConfig => {
  let labelMode: 0 | 1 | 2 = 0;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    if (key === "labelMode" && (value === 0 || value === 1 || value === 2)) {
      labelMode = value;
    } else if (key === "controlled" && typeof value === "boolean") {
      controlled ||= value;
    } else if (key === "value" && typeof value === "number") {
      pinned = value;
      controlled = true;
    } else if (key === "items" && Array.isArray(value)) {
      continue;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return {
    labelMode,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

const NODES = 7;

const partOf = (target: string | undefined): "combobox" | "node" => {
  const name = (target ?? "input").replace(/:\d+$/, "");
  if (name === "input" || name === "combobox" || name === "trigger") {
    return "combobox";
  }
  if (name === "treeitem" || name === "node" || name === "option") {
    return "node";
  }
  throw new Unsupported(`part ${name}`);
};

const nodeIndex = (target: string | undefined): number => {
  const match = /^(?:treeitem|node|option):(\d+)$/.exec(target ?? "");
  return match?.[1] === undefined ? 0 : Number(match[1]);
};

const focusEvent = specEvent("focus");

export const comboboxTreeBridge: SpecBridge = {
  setup: (config) => {
    const { labelMode, controlled, accepts, pinned } = comboboxTreeConfig(config);
    const events: Array<QuintEvent> = [];
    if (labelMode !== 0) {
      events.push(specEvent("set_label_mode", { v: BigInt(labelMode) }));
    }
    if (controlled) {
      events.push(specEvent("control"));
      if (pinned !== null) {
        events.push(specEvent("set_value", { n: BigInt(pinned) }));
      }
      if (accepts) {
        events.push(specEvent("acceptRequests"));
      }
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
        return partOf(step.target) === "node"
          ? [specEvent("click_node", { n: BigInt(nodeIndex(step.target)) })]
          : [specEvent("click_input")];
      case "key": {
        if (step.repeat === true) {
          throw new Unsupported("repeat");
        }
        const key = step.key ?? "";
        if (key.length === 1 && key !== " ") {
          return [focusEvent, specEvent("type_char")];
        }
        switch (key) {
          case "ArrowDown":
            return [focusEvent, specEvent("arrow_down")];
          case "ArrowUp":
            return [focusEvent, specEvent("arrow_up")];
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
          default:
            throw new Unsupported(`key ${JSON.stringify(key)}`);
        }
      }
      case "type": {
        const text = step.text ?? "";
        if (text.length < 1) {
          throw new Unsupported(`type ${JSON.stringify(text)}`);
        }
        return [focusEvent, specEvent("type_char")];
      }
      case "prop": {
        if (step.prop === "setLabelMode" && typeof step.value === "number") {
          return [specEvent("set_label_mode", { v: BigInt(step.value) })];
        }
        if (step.prop === "setValue" && typeof step.value === "number") {
          return [specEvent("set_value", { n: BigInt(step.value) })];
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
    active: num(state["active"]),
    selected: num(state["selected"]),
    picked: num(state["picked"]),
    labelMode: num(state["labelMode"]),
  }),
  focus: (state) => (state["focused"] === true ? "input" : null),
  attr: (state, target, name) => {
    const open = state["open"] === true;
    const active = num(state["active"]);
    const selected = num(state["selected"]);
    const part = partOf(target);
    if (part === "combobox") {
      if (name === "aria-haspopup") {
        return "tree";
      }
      if (name === "aria-expanded") {
        return String(open);
      }
      if (name === "aria-activedescendant") {
        return open && active >= 0 ? `treeitem:${active}` : null;
      }
    } else if (name === "aria-selected") {
      return String(open && selected === nodeIndex(target));
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) =>
    state["open"] === true
      ? ["popup", ...[...Array(NODES).keys()].map((index) => `treeitem:${index}`)]
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

export const comboboxTreeSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "input" },
  { event: "blur", target: "input" },
  { event: "click", target: "input" },
  { event: "key", key: "ArrowDown", target: "input" },
  { event: "key", key: "ArrowUp", target: "input" },
  { event: "key", key: "ArrowLeft", target: "input" },
  { event: "key", key: "ArrowRight", target: "input" },
  { event: "key", key: "Home", target: "input" },
  { event: "key", key: "End", target: "input" },
  { event: "key", key: "Enter", target: "input" },
  { event: "key", key: "Escape", target: "input" },
  { event: "key", key: "Tab", target: "input" },
  { event: "key", key: "a", target: "input" },
  { event: "prop", prop: "setValue", value: 1 },
  { event: "prop", prop: "setValue", value: 6 },
  { event: "prop", prop: "setLabelMode", value: 1 },
  { event: "prop", prop: "setLabelMode", value: 2 },
  { event: "prop", prop: "hostToggle" },
];

export const comboboxTreeProbe: Probe = {
  attrs: [
    ["input", "aria-haspopup"],
    ["input", "aria-expanded"],
    ["input", "aria-activedescendant"],
    ["treeitem:0", "aria-selected"],
    ["treeitem:1", "aria-selected"],
  ],
  events: ["onOpenChange"],
};
