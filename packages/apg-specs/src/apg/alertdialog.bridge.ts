import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, boolean | bigint | string> = {},
): QuintEvent => ({ _tag: tag, ...params });

export interface AlertDialogConfig {
  readonly open: boolean;
  readonly role: "alertdialog";
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back as the value. */
  readonly accepts: boolean;
}

const CONFIG_KEYS = new Set([
  "open",
  "defaultOpen",
  "modal",
  "role",
  "controlled",
  "accepts",
  "vetoClose",
]);

/**
 * Scenario `config` -> what both targets are mounted with. `controlled` puts the
 * open state in a host; the host accepts every request (a page that keeps the
 * state in a signal) unless `accepts: false` (or base-ui's `vetoClose`), which
 * pins the value and rejects. `open` is the initial / pinned value.
 */
export const alertdialogConfig = (config: ScenarioConfig): AlertDialogConfig => {
  let open = false;
  let controlled = false;
  let accepts = true;
  for (const [key, raw] of Object.entries(config)) {
    if (!CONFIG_KEYS.has(key)) {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
    if ((key === "open" || key === "defaultOpen") && typeof raw === "boolean") {
      open = raw;
    } else if (key === "controlled" && typeof raw === "boolean") {
      controlled ||= raw;
    } else if (key === "accepts" && typeof raw === "boolean") {
      accepts = raw;
    } else if (key === "vetoClose" && raw === true) {
      controlled = true;
      accepts = false;
    } else if (key === "modal" && raw === true) {
      continue;
    } else if (key === "role" && raw === "alertdialog") {
      continue;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return {
    open,
    role: "alertdialog",
    controlled,
    accepts: controlled && accepts,
  };
};

const PART = /^trigger|dialog|cancel|confirm|save|input|backdrop|dismiss$/;

const part = (target: string | undefined): string => {
  const name = (target ?? "").replace(/:0$/, "");
  if (!PART.test(name)) {
    throw new Unsupported(`part ${name}`);
  }
  return name;
};

const ACTIVATION_KEYS = new Set(["Enter", " ", "Space"]);

const triggerTarget = (name: string): number => {
  switch (name) {
    case "input":
      return 1;
    case "save":
      return 2;
    case "trigger":
      return 3;
    case "cancel":
      return 101;
    case "confirm":
      return 102;
    default:
      throw new Unsupported(`part ${name}`);
  }
};

export const alertdialogBridge: SpecBridge = {
  setup: (config) => {
    const { open, controlled, accepts } = alertdialogConfig(config);
    if (controlled) {
      return [
        specEvent("control"),
        ...(accepts ? [specEvent("acceptRequests")] : []),
        ...(open ? [specEvent("setValue", { v: true })] : []),
      ];
    }
    return open ? [specEvent("focus_attempt", { target: 3n }), specEvent("activate")] : [];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "click": {
        const name = part(step.target);
        if (name === "backdrop" || name === "dismiss") {
          return [specEvent("escape")];
        }
        return [
          specEvent("focus_attempt", { target: BigInt(triggerTarget(name)) }),
          specEvent("activate"),
        ];
      }
      case "key": {
        if (step.key === "Escape") {
          return [specEvent("escape")];
        }
        part(step.target);
        if (ACTIVATION_KEYS.has(step.key ?? "")) {
          return [specEvent("activate")];
        }
        throw new Unsupported(`key ${step.key ?? ""}`);
      }
      case "prop":
        switch (step.prop) {
          case "focusInput":
          case "focusSave":
          case "focusTrigger":
          case "focusCancel":
          case "focusConfirm":
            return [
              specEvent("focus_attempt", {
                target: BigInt(triggerTarget(step.prop.slice(5).toLowerCase())),
              }),
            ];
          case "activate":
            return [specEvent("activate")];
          case "escape":
            return [specEvent("escape")];
          case "tab":
            return [specEvent("tab")];
          case "shiftTab":
            return [specEvent("shift_tab")];
          case "typeText":
            return [specEvent("type_text")];
          case "clearText":
            return [specEvent("clear_text")];
          case "ctrlS":
            return [specEvent("ctrl_s")];
          case "pointerOutside":
            return [specEvent("pointer_outside")];
          case "setValue":
            return [specEvent("setValue", { v: step.value === true })];
          case "hostToggle":
            return [specEvent("hostToggle")];
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      case "hover":
      case "unhover":
        return [];
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state: QuintModelValue) => state["isOpen"] === true,
  focus: (state: QuintModelValue) => {
    const open = state["isOpen"] === true;
    const encoded = Number(state["focus"]);
    const pos = encoded % 100;
    if (!open) {
      if (pos === 1) return "input";
      if (pos === 2) return "save";
      if (pos === 3) return "trigger";
      return null;
    }
    if (pos === 1) return "cancel";
    if (pos === 2) return "confirm";
    return null;
  },
  attr: (state: QuintModelValue, target: string, name: string) => {
    const open = state["isOpen"] === true;
    const notes = Number(state["notes"]);
    const saved = Number(state["stored"]);
    const name0 = part(target);
    if (name0 === "dialog") {
      if (name === "role") {
        return "alertdialog";
      }
      if (name === "aria-modal") {
        return open ? "true" : null;
      }
      if (name === "aria-labelledby") {
        return "title";
      }
      if (name === "aria-describedby") {
        return "description";
      }
    } else if (name0 === "trigger" && name === "aria-disabled") {
      return notes === 0 ? "true" : null;
    } else if (name0 === "save" && name === "aria-disabled") {
      return notes === saved ? "true" : null;
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state: QuintModelValue) => (state["isOpen"] === true ? ["dialog"] : []),
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onOpenChange", after["requested"] === true] as const],
};

/** The user-level steps a differential walk draws from. */
export const alertdialogSteps: ReadonlyArray<ActionStep> = [
  { event: "prop", prop: "focusInput" },
  { event: "prop", prop: "focusSave" },
  { event: "prop", prop: "focusTrigger" },
  { event: "prop", prop: "focusCancel" },
  { event: "prop", prop: "focusConfirm" },
  { event: "prop", prop: "activate" },
  { event: "prop", prop: "escape" },
  { event: "prop", prop: "tab" },
  { event: "prop", prop: "shiftTab" },
  { event: "prop", prop: "typeText" },
  { event: "prop", prop: "clearText" },
  { event: "prop", prop: "ctrlS" },
  { event: "prop", prop: "pointerOutside" },
  { event: "prop", prop: "setValue", value: true },
  { event: "prop", prop: "setValue", value: false },
  { event: "prop", prop: "hostToggle" },
];

export const alertdialogProbe: Probe = {
  attrs: [
    ["dialog", "role"],
    ["dialog", "aria-modal"],
    ["trigger", "aria-disabled"],
    ["save", "aria-disabled"],
  ],
  events: ["onOpenChange"],
};
