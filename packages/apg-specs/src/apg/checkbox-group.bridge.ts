import type { ActionStep, Probe, ScenarioConfig, SpecBridge } from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";
import { Unsupported } from "../scenario";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, boolean | string | bigint> = {},
): QuintEvent => ({ _tag: tag, ...params });

/** Scenario `config` -> what both targets are mounted with. */
export interface CheckboxGroupConfig {
  readonly parent: boolean;
  readonly remember: boolean;
  readonly values: ReadonlyArray<string>;
  readonly children: ReadonlyArray<boolean>;
  readonly controlled: boolean;
  readonly accepts: boolean;
}

const isStringArray = (value: Schema.Json): value is ReadonlyArray<string> =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const b2i = (value: boolean): number => (value ? 1 : 0);
const packed = (children: ReadonlyArray<boolean>): number =>
  b2i(children[0] === true) + 2 * b2i(children[1] === true) + 4 * b2i(children[2] === true);

/**
 * Tri-state checkbox-group vocabulary <-> `specs/apg/checkbox-group.qnt`. The
 * controller is `checkbox:parent`, the three children `checkbox:0..2`; `group`
 * is the fieldset around them. `value` is the controlled checked set (a host
 * that accepts every request); `defaultValue` is the uncontrolled starting set.
 * The spec fixes the group at three children, so a different size or a config
 * the spec does not model throws `Unsupported`.
 */
export const checkboxGroupConfig = (config: ScenarioConfig): CheckboxGroupConfig => {
  let isGroup = false;
  let parent = false;
  let remember: boolean | undefined;
  let values: ReadonlyArray<string> | undefined;
  let selected: ReadonlyArray<string> = [];
  let controlled = false;
  let accepts = true;

  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "group":
        if (value !== true) {
          throw new Unsupported(`group ${JSON.stringify(value)}`);
        }
        isGroup = true;
        break;
      case "parent":
        parent = value === true;
        break;
      case "remember":
        remember = value === true;
        break;
      case "values":
        if (!isStringArray(value)) {
          throw new Unsupported(`values ${JSON.stringify(value)}`);
        }
        values = value;
        break;
      case "value":
        if (!isStringArray(value)) {
          throw new Unsupported(`value ${JSON.stringify(value)}`);
        }
        controlled = true;
        selected = value;
        break;
      case "defaultValue":
        if (!isStringArray(value)) {
          throw new Unsupported(`defaultValue ${JSON.stringify(value)}`);
        }
        selected = value;
        break;
      case "controlled":
        controlled = value === true;
        break;
      case "accepts":
        controlled = true;
        accepts = value === true;
        break;
      case "items":
        if (value !== 3) {
          throw new Unsupported(`items ${JSON.stringify(value)}`);
        }
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }

  if (!isGroup) {
    throw new Unsupported("not a checkbox group");
  }
  const resolved = values ?? ["0", "1", "2"];
  if (resolved.length !== 3) {
    throw new Unsupported(`values length ${resolved.length} (spec models three)`);
  }
  return {
    parent,
    remember: remember ?? parent,
    values: resolved,
    children: resolved.map((item) => selected.includes(item)),
    controlled,
    accepts,
  };
};

const FOCUS = new Set(["parent", "c0", "c1", "c2"]);
const TARGETS = new Set(["checkbox:parent", "checkbox:0", "checkbox:1", "checkbox:2"]);

const targetOf = (target: string | undefined): "parent" | "c0" | "c1" | "c2" => {
  if (target === undefined || !TARGETS.has(target)) {
    throw new Unsupported(`target ${target ?? ""}`);
  }
  if (target === "checkbox:parent") {
    return "parent";
  }
  return `c${target.slice("checkbox:".length)}` as "c0" | "c1" | "c2";
};

const labelOf = (focus: string): string =>
  focus === "parent" ? "checkbox:parent" : `checkbox:${focus.slice(1)}`;

const jsonKey = (value: Schema.Json | undefined): string | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const key = (value as Readonly<Record<string, Schema.Json>>)["key"];
  return typeof key === "string" ? key : undefined;
};

const focusEvents = (target: string | undefined): ReadonlyArray<QuintEvent> => {
  const focus = targetOf(target);
  return [specEvent("focus_on", { target: focus })];
};

/** A walk's prop value names the spec focus directly (`parent`, `c0`..`c2`). */
const focusOfValue = (value: Schema.Json | undefined): string => {
  if (typeof value !== "string" || !FOCUS.has(value)) {
    throw new Unsupported(`target ${JSON.stringify(value)}`);
  }
  return value;
};

const programmatic = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "remember":
      return [specEvent("set_remember", { value: step.value === true })];
    case "focus":
      return [specEvent("focus_on", { target: focusOfValue(step.value) })];
    case "blur":
      return [specEvent("blur")];
    case "click":
      return [specEvent("click", { target: focusOfValue(step.value) })];
    case "key": {
      const key = jsonKey(step.value);
      if (key === "Tab") {
        return [specEvent("key_tab")];
      }
      if (key === " " || key === "Space") {
        return [specEvent("key_space")];
      }
      throw new Unsupported(`prop key ${JSON.stringify(step.value)}`);
    }
    case "setValue": {
      if (typeof step.value === "boolean") {
        return [specEvent("setValue", { v: BigInt(step.value ? 1 : 0) })];
      }
      if (typeof step.value === "number" && Number.isInteger(step.value)) {
        return [specEvent("setValue", { v: BigInt(step.value) })];
      }
      if (Array.isArray(step.value)) {
        const bits = step.value;
        return [
          specEvent("setValue", {
            v: BigInt(packed([0, 1, 2].map((index) => bits[index] === true))),
          }),
        ];
      }
      throw new Unsupported(`prop ${step.prop}=${JSON.stringify(step.value)}`);
    }
    case "hostToggle":
      return [specEvent("hostToggle", { panel: BigInt(0) })];
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

export const checkboxGroupBridge: SpecBridge = {
  setup: (config) => {
    const mount = checkboxGroupConfig(config);
    return [
      ...(mount.remember ? [specEvent("set_remember", { value: true })] : []),
      ...(mount.controlled ? [specEvent("control")] : []),
      ...(mount.controlled && mount.accepts ? [specEvent("acceptRequests")] : []),
      ...(mount.controlled && mount.children.some(Boolean)
        ? [specEvent("setValue", { v: BigInt(packed(mount.children)) })]
        : []),
    ];
  },
  event: (step) => {
    switch (step.event) {
      case "focus":
        return focusEvents(step.target);
      case "blur":
        return [specEvent("blur")];
      case "click":
        return [specEvent("click", { target: targetOf(step.target) })];
      case "key":
        targetOf(step.target);
        if (step.key === "Tab") {
          return [specEvent("key_tab")];
        }
        if (step.key === " " || step.key === "Space") {
          return [specEvent("key_space")];
        }
        throw new Unsupported(`key ${step.key ?? ""}`);
      case "prop":
        return programmatic(step);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state: QuintModelValue) => {
    const focus = state["focus"];
    return typeof focus === "string" && FOCUS.has(focus) ? labelOf(focus) : null;
  },
  attr: (state: QuintModelValue, target: string, name: string) => {
    const part = targetOf(target);
    if (name === "role") {
      return "checkbox";
    }
    if (name !== "aria-checked") {
      throw new Unsupported(`attribute ${name} on ${target}`);
    }
    if (part === "parent") {
      const all = state["c0"] === true && state["c1"] === true && state["c2"] === true;
      const none = state["c0"] !== true && state["c1"] !== true && state["c2"] !== true;
      return all ? "true" : none ? "false" : "mixed";
    }
    return state[part] === true ? "true" : "false";
  },
  visible: () => [],
  // The callback payload is the checked labels, which the spec does not carry
  // (it keys by index); the walk observes committed state through aria-checked.
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const checkboxGroupSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "focus", value: "c0" },
  { event: "prop", prop: "focus", value: "c1" },
  { event: "prop", prop: "focus", value: "c2" },
  { event: "prop", prop: "focus", value: "parent" },
  { event: "prop", prop: "blur" },
  { event: "prop", prop: "key", value: { key: "Tab" } },
  { event: "prop", prop: "key", value: { key: " " } },
  { event: "prop", prop: "click", value: "c0" },
  { event: "prop", prop: "click", value: "c1" },
  { event: "prop", prop: "click", value: "c2" },
  { event: "prop", prop: "click", value: "parent" },
  { event: "prop", prop: "remember", value: true },
  { event: "prop", prop: "remember", value: false },
  { event: "prop", prop: "setValue", value: 1 },
  { event: "prop", prop: "setValue", value: 6 },
  { event: "prop", prop: "setValue", value: 0 },
  { event: "prop", prop: "hostToggle" },
];

export const checkboxGroupProbe: Probe = {
  attrs: [
    ["checkbox:parent", "aria-checked"],
    ["checkbox:0", "aria-checked"],
    ["checkbox:1", "aria-checked"],
    ["checkbox:2", "aria-checked"],
  ],
  events: [],
};
