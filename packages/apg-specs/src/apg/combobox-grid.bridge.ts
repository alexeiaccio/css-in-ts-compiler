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

/** cellValues: true = one suggestion per cell, false = one per row. */
export interface ComboboxGridConfig {
  readonly cellValues: boolean;
  /** The host owns the picked suggestion (`value` prop present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned suggestion the host holds (rejects every request). */
  readonly pinned: number | null;
}

export const comboboxGridConfig = (config: ScenarioConfig): ComboboxGridConfig => {
  let cellValues = false;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    if ((key === "cellValues" || key === "layout") && typeof value === "boolean") {
      cellValues = value;
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
    cellValues,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

const COLS = 3;

const partOf = (target: string | undefined): "combobox" | "cell" => {
  const name = (target ?? "input").replace(/:\d+$/, "");
  if (name === "input" || name === "combobox" || name === "trigger") {
    return "combobox";
  }
  if (name === "cell" || name === "gridcell" || name === "option") {
    return "cell";
  }
  throw new Unsupported(`part ${name}`);
};

const cellIndex = (target: string | undefined): number => {
  const match = /^(?:cell|gridcell|option):(\d+)$/.exec(target ?? "");
  return match?.[1] === undefined ? 0 : Number(match[1]);
};

const focusEvent = specEvent("focus");

export const comboboxGridBridge: SpecBridge = {
  setup: (config) => {
    const { cellValues, controlled, accepts, pinned } = comboboxGridConfig(config);
    const events: Array<QuintEvent> = [];
    if (cellValues) {
      events.push(specEvent("set_layout", { cells: true }));
    }
    if (controlled) {
      events.push(specEvent("control"));
      if (pinned !== null) {
        events.push(specEvent("set_value", { i: BigInt(pinned) }));
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
        return partOf(step.target) === "cell"
          ? [specEvent("click_cell", { k: BigInt(cellIndex(step.target)) })]
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
          case "Backspace":
            return [focusEvent, specEvent("backspace")];
          case "Delete":
            return [focusEvent, specEvent("delete")];
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
        if (step.prop === "setLayout" && typeof step.value === "boolean") {
          return [specEvent("set_layout", { cells: step.value })];
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
    open: state["open"] === true,
    row: num(state["row"]),
    col: num(state["col"]),
    picked: num(state["picked"]),
    cellValues: state["cellValues"] === true,
  }),
  focus: (state) => (state["focused"] === true ? "input" : null),
  attr: (state, target, name) => {
    const open = state["open"] === true;
    const row = num(state["row"]);
    const col = num(state["col"]);
    const part = partOf(target);
    if (part === "combobox") {
      if (name === "aria-haspopup") {
        return "grid";
      }
      if (name === "aria-expanded") {
        return String(open);
      }
      if (name === "aria-activedescendant") {
        return row >= 0 && col >= 0 ? `cell:${row * COLS + col}` : null;
      }
    } else if (name === "aria-selected") {
      const index = cellIndex(target);
      const cellValues = state["cellValues"] === true;
      return String(
        row >= 0 && (cellValues ? row * COLS + col === index : row === Math.floor(index / COLS)),
      );
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) => (state["open"] === true ? ["popup"] : []),
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

export const comboboxGridSteps: ReadonlyArray<ActionStep> = [
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
  { event: "key", key: "Backspace", target: "input" },
  { event: "key", key: "Delete", target: "input" },
  { event: "key", key: "a", target: "input" },
  { event: "prop", prop: "setValue", value: 1 },
  { event: "prop", prop: "setValue", value: 2 },
  { event: "prop", prop: "setLayout", value: true },
  { event: "prop", prop: "setLayout", value: false },
  { event: "prop", prop: "hostToggle" },
];

export const comboboxGridProbe: Probe = {
  attrs: [
    ["input", "aria-haspopup"],
    ["input", "aria-expanded"],
    ["input", "aria-activedescendant"],
    ["cell:0", "aria-selected"],
    ["cell:1", "aria-selected"],
  ],
  events: ["onOpenChange"],
};
