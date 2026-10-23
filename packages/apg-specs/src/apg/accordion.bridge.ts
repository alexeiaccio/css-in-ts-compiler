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
const specEvent = (tag: string, params: Record<string, boolean | bigint> = {}): QuintEvent => ({
  _tag: tag,
  ...params,
});

/** The generator models a fixed three-panel accordion (no collection state). */
const PANELS = 3;

type Part = { readonly kind: "trigger" | "panel" | "heading"; index: number };

/**
 * Scenario parts -> the spec's names: `trigger` <- `header`, `panel` <- `content`;
 * `heading` is the static wrapper. Anything else (groups, menus, ...) is
 * `Unsupported`, which skips the scenario on every target.
 */
const partOf = (target: string | undefined): Part => {
  const [name = "", indexText] = (target ?? "trigger").split(":");
  const index = Number(indexText ?? "0");
  if (name === "trigger" || name === "header" || name === "button") {
    return { kind: "trigger", index };
  }
  if (name === "panel" || name === "content") {
    return { kind: "panel", index };
  }
  if (name === "heading") {
    return { kind: "heading", index };
  }
  throw new Unsupported(`part ${name}`);
};

export interface AccordionConfig {
  readonly items: number;
  /** `defaultValue` when uncontrolled, the initial `value` prop when controlled. */
  readonly expanded: ReadonlyArray<boolean>;
  readonly multiple: boolean;
  readonly collapsible: boolean;
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back as the value. */
  readonly accepts: boolean;
}

const b2i = (value: boolean): number => (value ? 1 : 0);
/** Bit 0 = panel 0, bit 1 = panel 1, bit 2 = panel 2. */
const packed = (expanded: ReadonlyArray<boolean>): number =>
  b2i(expanded[0] === true) + 2 * b2i(expanded[1] === true) + 4 * b2i(expanded[2] === true);

const expandedIndicesOfPacked = (packedValue: number): ReadonlyArray<number> =>
  [0, 1, 2].filter((index) => Math.floor(packedValue / 2 ** index) % 2 === 1);

/** Resolve one `expanded` entry (an index or a boolean) to a panel index. */
const indexOf = (entry: Schema.Json, items: number): number => {
  if (typeof entry === "number" && Number.isInteger(entry)) {
    if (entry < 0 || entry >= items) {
      throw new Unsupported(`expanded index ${entry}`);
    }
    return entry;
  }
  throw new Unsupported(`expanded entry ${JSON.stringify(entry)}`);
};

/**
 * Scenario `config` -> what both targets are mounted with. `expanded` is the
 * controlled value (a host that rejects every request, like react-aria's
 * `isExpanded`); `controlled` alone is a host that accepts every request;
 * `accepts` overrides. `defaultExpanded` is the initial value either way. The
 * spec models a fixed three-panel accordion, per-panel disabled, item values,
 * custom ids and the keep-mounted / hidden-until-found flags are not modelled
 * and make the scenario `Unsupported` (skipped, never silently replayed).
 */
export const accordionConfig = (config: ScenarioConfig): AccordionConfig => {
  let items = PANELS;
  let multiple = false;
  let collapsible = true;
  let controlled = false;
  let accepts = false;
  const expanded = [false, false, false];
  for (const [key, value] of Object.entries(config)) {
    if (key === "items") {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > PANELS) {
        throw new Unsupported(`config items=${JSON.stringify(value)}`);
      }
      items = value;
    } else if (key === "defaultExpanded") {
      if (!Array.isArray(value)) {
        throw new Unsupported(`config defaultExpanded=${JSON.stringify(value)}`);
      }
      for (const entry of value) {
        expanded[indexOf(entry, items)] = true;
      }
    } else if (key === "expanded") {
      controlled = true;
      if (typeof value === "boolean") {
        expanded[0] = value;
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          expanded[indexOf(entry, items)] = true;
        }
      } else {
        throw new Unsupported(`config expanded=${JSON.stringify(value)}`);
      }
    } else if (key === "controlled") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config controlled=${JSON.stringify(value)}`);
      }
      controlled = value;
      accepts = value;
    } else if (key === "accepts") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config accepts=${JSON.stringify(value)}`);
      }
      controlled = true;
      accepts = value;
    } else if (key === "multiple") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config multiple=${JSON.stringify(value)}`);
      }
      multiple = value;
    } else if (key === "collapsible") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config collapsible=${JSON.stringify(value)}`);
      }
      collapsible = value;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { items, expanded, multiple, collapsible, controlled, accepts };
};

const expandedCount = (state: QuintModelValue): number =>
  (state["expanded0"] === true ? 1 : 0) +
  (state["expanded1"] === true ? 1 : 0) +
  (state["expanded2"] === true ? 1 : 0);

const expandedAt = (state: QuintModelValue, index: number): boolean =>
  state[`expanded${index}`] === true;

const canCollapse = (state: QuintModelValue): boolean =>
  state["collapsible"] === true || expandedCount(state) >= 2;

const expandedIndices = (state: QuintModelValue): ReadonlyArray<number> =>
  [0, 1, 2].filter((index) => expandedAt(state, index));

const indicesFrom = (value: Schema.Json | undefined): ReadonlyArray<boolean> => {
  if (typeof value === "boolean") {
    return [value, false, false];
  }
  if (!Array.isArray(value)) {
    throw new Unsupported(`expanded value=${JSON.stringify(value)}`);
  }
  const expanded = [false, false, false];
  for (const entry of value) {
    expanded[indexOf(entry, PANELS)] = true;
  }
  return expanded;
};

const programmatic = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "multiple":
      return [specEvent("set_multiple", { allow: step.value === true })];
    case "collapsible":
      return [specEvent("set_collapsible", { allow: step.value === true })];
    case "headingLevel": {
      const level = typeof step.value === "number" ? step.value : 0;
      if (!Number.isInteger(level) || level < 1 || level > 6) {
        throw new Unsupported(`headingLevel ${JSON.stringify(step.value)}`);
      }
      return [specEvent("set_heading_level", { level: BigInt(level) })];
    }
    case "expanded":
    case "setValue":
      return [specEvent("setValue", { v: BigInt(packed(indicesFrom(step.value))) })];
    case "hostToggle":
      return [specEvent("hostToggle", { panel: BigInt(0) })];
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

/**
 * Accordion vocabulary <-> `specs/apg/accordion.qnt`, shared by the spec driver
 * and the DOM driver so both gate scenarios identically.
 *
 * The spec has no "focus this header" event (`focus` is a Tab-driven slot), so
 * a `focus` step is a no-op here and activation is driven by the step's target
 * (`click_header`), which sets the same slot a real click would.
 */
export const accordionBridge: SpecBridge = {
  setup: (config) => {
    const { expanded, multiple, collapsible, controlled, accepts } = accordionConfig(config);
    const events: QuintEvent[] = [];
    if (multiple) {
      events.push(specEvent("set_multiple", { allow: true }));
    }
    if (!collapsible) {
      events.push(specEvent("set_collapsible", { allow: false }));
    }
    if (controlled) {
      events.push(specEvent("control"));
      if (accepts) {
        events.push(specEvent("acceptRequests"));
      }
      if (expanded.some(Boolean)) {
        events.push(specEvent("setValue", { v: BigInt(packed(expanded)) }));
      }
    } else {
      // click the desired panels back to front so single mode keeps the first
      for (const index of [2, 1, 0]) {
        if (expanded[index] === true) {
          events.push(specEvent("click_header", { panel: BigInt(index) }));
        }
      }
    }
    if (events.length > 0) {
      events.push(specEvent("blur"));
    }
    return events;
  },
  event: (step) => {
    switch (step.event) {
      case "focus":
        return [];
      case "blur":
        partOf(step.target);
        return [specEvent("blur")];
      case "click": {
        const { kind, index } = partOf(step.target);
        if (kind === "trigger") {
          return [specEvent("click_header", { panel: BigInt(index) })];
        }
        if (kind === "panel") {
          return [specEvent("click_content", { panel: BigInt(index) })];
        }
        throw new Unsupported(`click on ${step.target ?? ""}`);
      }
      case "key": {
        const { kind, index } = partOf(step.target);
        if (
          kind === "trigger" &&
          (step.key === "Enter" || step.key === " " || step.key === "Space")
        ) {
          return [specEvent("click_header", { panel: BigInt(index) })];
        }
        throw new Unsupported(`key ${step.key ?? ""} on ${step.target ?? ""}`);
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
  value: (state) => ({ expanded: expandedIndices(state) }),
  focus: (state) => {
    const slot = Number(state["focus"]);
    if (slot < 0) {
      return null;
    }
    return slot % 2 === 0 ? `trigger:${slot / 2}` : `panel:${(slot - 1) / 2}`;
  },
  attr: (state, target, name) => {
    const { kind, index } = partOf(target);
    if (kind === "trigger") {
      if (name === "aria-expanded") {
        return expandedAt(state, index) ? "true" : "false";
      }
      if (name === "aria-controls") {
        return `panel:${index}`;
      }
      if (name === "aria-disabled") {
        return expandedAt(state, index) && !canCollapse(state) ? "true" : null;
      }
    } else if (kind === "panel") {
      if (name === "hidden") {
        return expandedAt(state, index) ? null : "true";
      }
      if (name === "role") {
        return "region";
      }
      if (name === "aria-labelledby") {
        return `trigger:${index}`;
      }
    } else if (kind === "heading") {
      if (name === "role") {
        return "heading";
      }
      if (name === "aria-level") {
        return String(state["headingLevel"]);
      }
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) =>
    [0, 1, 2].flatMap((index) => (expandedAt(state, index) ? [`panel:${index}`] : [])),
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [["onExpandedChange", expandedIndicesOfPacked(Number(after["requested"]))] as const],
};

/** The user-level steps a differential walk draws from. */
export const accordionSteps: ReadonlyArray<ActionStep> = [
  { event: "click", target: "trigger:0" },
  { event: "click", target: "trigger:1" },
  { event: "click", target: "trigger:2" },
  { event: "key", key: "Enter", target: "trigger:0" },
  { event: "key", key: "Enter", target: "trigger:1" },
  { event: "key", key: "Enter", target: "trigger:2" },
  { event: "key", key: " ", target: "trigger:0" },
  { event: "key", key: " ", target: "trigger:1" },
  { event: "key", key: " ", target: "trigger:2" },
  { event: "prop", prop: "multiple", value: true },
  { event: "prop", prop: "multiple", value: false },
  { event: "prop", prop: "collapsible", value: false },
  { event: "prop", prop: "collapsible", value: true },
  { event: "prop", prop: "headingLevel", value: 2 },
  { event: "prop", prop: "headingLevel", value: 4 },
  { event: "prop", prop: "expanded", value: [0] },
  { event: "prop", prop: "expanded", value: [0, 1] },
  { event: "prop", prop: "expanded", value: [] },
  { event: "prop", prop: "hostToggle" },
];

export const accordionProbe: Probe = {
  attrs: [
    ["trigger:0", "aria-expanded"],
    ["trigger:1", "aria-expanded"],
    ["trigger:2", "aria-expanded"],
    ["trigger:0", "aria-disabled"],
    ["trigger:1", "aria-disabled"],
    ["panel:0", "hidden"],
    ["panel:1", "hidden"],
    ["panel:2", "hidden"],
  ],
  events: ["onExpandedChange"],
};
