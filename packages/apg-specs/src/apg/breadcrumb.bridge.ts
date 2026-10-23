import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

/**
 * Scenario `config` -> what both targets are mounted with. `items` is the trail
 * length; `label`/`labelledby`/`describedby` name the navigation landmark.
 * A non-default element type / showRoot is not modelled (see the span suites).
 */
export interface BreadcrumbConfig {
  readonly count: number;
  readonly disabled: boolean;
  readonly label: string | undefined;
  readonly labelledby: string | undefined;
  readonly describedby: string | undefined;
}

const asString = (key: string, value: Schema.Json): string => {
  if (typeof value === "string") {
    return value;
  }
  throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
};

export const breadcrumbConfig = (config: ScenarioConfig): BreadcrumbConfig => {
  let count = 1;
  let disabled = false;
  let label: string | undefined;
  let labelledby: string | undefined;
  let describedby: string | undefined;
  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "items":
        if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
          count = value;
        } else if (Array.isArray(value)) {
          count = value.length;
        } else {
          throw new Unsupported(`items ${JSON.stringify(value)}`);
        }
        break;
      case "isDisabled":
      case "disabled":
        disabled = value === true;
        break;
      case "aria-label":
        label = asString(key, value);
        break;
      case "aria-labelledby":
        labelledby = asString(key, value);
        break;
      case "aria-describedby":
        describedby = asString(key, value);
        break;
      case "isCurrent":
        if (value !== true) {
          throw new Unsupported(`isCurrent ${JSON.stringify(value)}`);
        }
        break;
      default:
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { count, disabled, label, labelledby, describedby };
};

const currentIndexOf = (target: string | undefined): number =>
  Number((target ?? "item:0").replace(/^item:/, "")) + 1;

/**
 * Breadcrumb vocabulary <-> `specs/apg/breadcrumb.qnt`. Parts: `nav` (the
 * landmark), `breadcrumb` (the list), `item:N` and `link:N`. The spec only
 * tracks which item carries `aria-current=page` (the last one), which both the
 * item and its link expose.
 */
export const breadcrumbBridge: SpecBridge = {
  setup: (config) => {
    const { count } = breadcrumbConfig(config);
    const events: QuintEvent[] = [];
    for (let item = 1; item < count; item += 1) {
      events.push(specEvent("descend"));
    }
    return events;
  },
  event: (step: ActionStep) => {
    if (step.event === "click") {
      return [];
    }
    if (step.event !== "prop") {
      throw new Unsupported(`event ${step.event}`);
    }
    switch (step.prop) {
      case "descend":
        return [specEvent("descend")];
      case "renderLink":
        return [specEvent("renderLink")];
      case "renderText":
        return [specEvent("renderText")];
      case "toggleMark":
        return [specEvent("toggleMark")];
      case "ancestor": {
        if (typeof step.value !== "number" || !Number.isInteger(step.value)) {
          throw new Unsupported(`ancestor ${JSON.stringify(step.value)}`);
        }
        return [specEvent("ancestor", { target: BigInt(step.value) })];
      }
      default:
        throw new Unsupported(`prop ${step.prop ?? ""}`);
    }
  },
  focus: () => null,
  attr: (state, target, name) => {
    const part = (target ?? "").replace(/:0$/, "");
    if (part === "breadcrumb" && name === "role") {
      return "list";
    }
    if (part.startsWith("item")) {
      if (name === "role") {
        return "listitem";
      }
      if (name === "aria-current") {
        return currentIndexOf(target) === Number(state["currentIndex"]) ? "page" : null;
      }
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) => {
    const depth = Number(state["depth"]);
    return ["breadcrumb", ...Array.from({ length: depth }, (_, index) => `item:${index}`)];
  },
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const breadcrumbSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "renderText" },
  { event: "prop", prop: "renderLink" },
  { event: "prop", prop: "toggleMark" },
];

export const breadcrumbProbe: Probe = {
  attrs: [
    ["breadcrumb", "role"],
    ["item:0", "role"],
    ["item:0", "aria-current"],
    ["item:1", "aria-current"],
    ["item:2", "aria-current"],
    ["item:3", "aria-current"],
  ],
  events: [],
};
