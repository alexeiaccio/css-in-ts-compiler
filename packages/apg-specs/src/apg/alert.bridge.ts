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
const specEvent = (tag: string): QuintEvent => ({ _tag: tag });

/**
 * Scenario `config` -> what both targets are mounted with. `titleId` /
 * `descriptionId` are static label associations the alert carries.
 */
export interface AlertConfig {
  readonly titleId: string | undefined;
  readonly descriptionId: string | undefined;
}

const asString = (key: string, value: Schema.Json): string => {
  if (typeof value === "string") {
    return value;
  }
  throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
};

export const alertConfig = (config: ScenarioConfig): AlertConfig => {
  let titleId: string | undefined;
  let descriptionId: string | undefined;
  for (const [key, value] of Object.entries(config)) {
    if (key === "titleId") {
      titleId = asString(key, value);
    } else if (key === "descriptionId") {
      descriptionId = asString(key, value);
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { titleId, descriptionId };
};

const partOf = (target: string | undefined): string => (target ?? "alert").replace(/:0$/, "");

const LIVE_PARTS = new Set(["alert", "content"]);
const DIALOG_PARTS = new Set(["toast", "root"]);

const mounted = (state: QuintModelValue): boolean => state["mounted"] === true;

/**
 * Alert vocabulary <-> `specs/apg/alert.qnt`. The spec part is `alert`; the
 * fixtures also carry the library containers (`toast`/`root`, `content`).
 * Clicking `add`/`add-high` shows a message, `close`/`dismiss` closes it. Static
 * label wiring is not spec state.
 */
export const alertBridge: SpecBridge = {
  setup: () => [],
  event: (step: ActionStep) => {
    if (step.event === "click") {
      const part = partOf(step.target);
      if (part === "add" || part === "add-high") {
        return [specEvent("show")];
      }
      if (part === "close" || part === "dismiss") {
        return [specEvent("dismiss")];
      }
      throw new Unsupported(`click on ${part}`);
    }
    if (step.event === "prop") {
      if (step.prop === "show") {
        return [specEvent("show")];
      }
      if (step.prop === "dismiss") {
        return [specEvent("dismiss")];
      }
      if (step.prop === "load") {
        return [specEvent("load")];
      }
      throw new Unsupported(`prop ${step.prop ?? ""}`);
    }
    throw new Unsupported(`event ${step.event}`);
  },
  focus: () => null,
  attr: (state, target, name) => {
    const part = partOf(target);
    if (LIVE_PARTS.has(part)) {
      if (name === "role") {
        return mounted(state) ? "alert" : null;
      }
      if (name === "aria-atomic") {
        return mounted(state) ? "true" : null;
      }
    } else if (DIALOG_PARTS.has(part)) {
      if (name === "role") {
        return mounted(state) ? "alertdialog" : null;
      }
      if (name === "aria-modal") {
        return mounted(state) ? "false" : null;
      }
    } else if (part === "close" && name === "aria-label") {
      return "Close";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const alertSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "show" },
  { event: "prop", prop: "dismiss" },
  { event: "prop", prop: "load" },
];

export const alertProbe: Probe = {
  attrs: [
    ["alert", "role"],
    ["alert", "aria-atomic"],
    ["toast", "role"],
    ["toast", "aria-modal"],
  ],
  events: [],
};
