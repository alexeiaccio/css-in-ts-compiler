import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent } from "@quint-machine/core";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (tag: string): QuintEvent => ({ _tag: tag });

/**
 * Scenario `config` -> what both targets are mounted with. A config with `href`
 * (or `native: true`) renders a native anchor; `elementType` picks a custom
 * `role=link` element. `disabled`/`active` are DOM state the spec does not model.
 */
export interface LinkConfig {
  readonly native: boolean;
  readonly href: string | undefined;
  readonly disabled: boolean;
  readonly current: boolean;
}

const PART_URLS = new Set(["elementType", "render"]);

export const linkConfig = (config: ScenarioConfig): LinkConfig => {
  let native = config["href"] !== undefined;
  let href: string | undefined;
  let disabled = false;
  let current = false;
  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case "native":
        native = value === true;
        break;
      case "href":
        if (typeof value !== "string") {
          throw new Unsupported(`href ${JSON.stringify(value)}`);
        }
        href = value;
        break;
      case "isDisabled":
      case "disabled":
        disabled = value === true;
        break;
      case "active":
        current = value === true;
        break;
      case "elementType":
      case "render":
        if (typeof value !== "string") {
          throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
        }
        native = false;
        break;
      default:
        if (PART_URLS.has(key)) {
          break;
        }
        throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  if (href !== undefined) {
    native = true;
  }
  return { native, href, disabled, current };
};

const partOf = (target: string | undefined): string => (target ?? "link").replace(/:0$/, "");

/**
 * Link vocabulary <-> `specs/apg/link.qnt`. Parts: `link` (and the fixture's
 * outside `button`). `key`/`click` focus first, as a user would. The spec does
 * not model `disabled`/`aria-current`; those stay DOM-only.
 */
export const linkBridge: SpecBridge = {
  setup: (config) => [linkConfig(config).native ? specEvent("setNative") : specEvent("setCustom")],
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus":
        if (partOf(step.target) !== "link") {
          throw new Unsupported(`focus on ${step.target ?? ""}`);
        }
        return [specEvent("focusLink")];
      case "blur":
        return [specEvent("blur")];
      case "click": {
        const part = partOf(step.target);
        if (part === "link") {
          return [specEvent("click")];
        }
        if (part === "button") {
          return [specEvent("focusLink")];
        }
        throw new Unsupported(`click on ${part}`);
      }
      case "key": {
        if (partOf(step.target) !== "link") {
          throw new Unsupported(`key on ${step.target ?? ""}`);
        }
        if (step.key === "Enter") {
          return [specEvent("focusLink"), specEvent("press")];
        }
        if (step.key === " " || step.key === "Space") {
          return [specEvent("focusLink"), specEvent("pressSpace")];
        }
        throw new Unsupported(`key ${step.key ?? ""}`);
      }
      case "prop":
        switch (step.prop) {
          case "back":
            return [specEvent("back")];
          case "native":
          case "setNative":
            return [specEvent("setNative")];
          case "custom":
          case "setCustom":
            return [specEvent("setCustom")];
          case "disabled":
          case "isDisabled":
          case "href":
          case "active":
          case "current":
            return [];
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state) => {
    const where = state["focus"];
    return where === "link" || where === "target" ? where : null;
  },
  attr: (state, target, name) => {
    if (partOf(target) !== "link") {
      throw new Unsupported(`attribute ${name} on ${target}`);
    }
    if (name === "role") {
      return state["native"] === true ? null : "link";
    }
    if (name === "tabindex") {
      return state["tabindex"] === true ? "0" : null;
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const linkSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "link" },
  { event: "key", key: "Enter", target: "link" },
  { event: "key", key: " ", target: "link" },
  { event: "click", target: "link" },
  { event: "prop", prop: "back" },
];

export const linkProbe: Probe = {
  attrs: [
    ["link", "role"],
    ["link", "tabindex"],
  ],
  events: [],
};
