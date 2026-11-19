import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
  checkUnknownConfigKey,
} from "../scenario";
import type { QuintEvent, QuintModelValue } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (tag: string, params: Record<string, string> = {}): QuintEvent => ({
  _tag: tag,
  ...params,
});

const num = (value: QuintModelValue[string] | undefined): number =>
  value === undefined ? 0 : Number(value);

const text = (value: QuintModelValue[string] | undefined): string =>
  typeof value === "string" ? value : "";

export type WorkspaceHome = "tabset0" | "tabset1" | "float" | "edge" | "out" | "closed";

const HOMES: ReadonlyArray<WorkspaceHome> = [
  "tabset0",
  "tabset1",
  "float",
  "edge",
  "out",
  "closed",
];

/**
 * A tab as the scenario file carries it: the id is the model's, the payload is
 * the host's (`{ id, data }`). The payload never reaches the model — a config
 * key the model cannot observe, routed through `checkUnknownConfigKey`.
 */
export interface WorkspaceConfig {
  readonly keepWhenEmpty: boolean;
  readonly tabs: ReadonlyArray<Schema.Json>;
}

export const WORKSPACE_TAB_COUNT = 4;

const isTab = (value: Schema.Json): value is ReadonlyArray<Schema.Json> =>
  Array.isArray(value) &&
  value.length === WORKSPACE_TAB_COUNT &&
  value.every(
    (tab) =>
      typeof tab === "object" &&
      tab !== null &&
      !Array.isArray(tab) &&
      typeof tab["id"] === "number",
  );

export const workspaceConfig = (config: ScenarioConfig): WorkspaceConfig => {
  let keepWhenEmpty = false;
  let tabs: ReadonlyArray<Schema.Json> = [0, 1, 2, 3].map((id) => ({ id, data: null }));
  for (const [key, raw] of Object.entries(config)) {
    if (key === "keepWhenEmpty" && typeof raw === "boolean") {
      keepWhenEmpty = raw;
    } else if (key === "tabs" && raw === true) {
      // the marker a JSON scenario carries; the fixture attaches the real payload
      continue;
    } else if (key === "tabs" && isTab(raw)) {
      tabs = raw;
    } else if (key === "tabs") {
      throw new Unsupported(`tabs ${JSON.stringify(raw)}`);
    } else {
      checkUnknownConfigKey(key, raw);
    }
  }
  return { keepWhenEmpty, tabs };
};

/** `tab:0`..`tab:3` and `tabset:0` / `tabset:1` / `tabset:F` / `tabset:E`. */
const tabIndex = (target: string | undefined): number => {
  const match = /^tab:(\d+)$/.exec(target ?? "");
  if (match === null) {
    throw new Unsupported(`part ${target ?? ""}`);
  }
  const index = Number(match[1]);
  if (index < 0 || index >= WORKSPACE_TAB_COUNT) {
    throw new Unsupported(`tab ${index}`);
  }
  return index;
};

const tabsetIndex = (target: string | undefined): number => {
  switch (target) {
    case "tabset:0":
      return 0;
    case "tabset:1":
      return 1;
    default:
      throw new Unsupported(`part ${target ?? ""}`);
  }
};

/** The drop target, as data: the model takes it, the host maps a position to it. */
const DROP_EVENTS: Readonly<Record<string, string>> = {
  "tab:0": "dropTab0",
  "tab:1": "dropTab1",
  tabF: "dropTabF",
  "edge-left": "dropEdgeLeft",
  "edge-right": "dropEdgeRight",
  "edge-top": "dropEdgeTop",
  "edge-bottom": "dropEdgeBottom",
  float: "dropFloat",
};

/** A scenario target in the spec's vocabulary: the `target` var and a copy's `copyTo`. */
const SPEC_TARGET: Readonly<Record<string, string>> = {
  "tab:0": "tab0",
  "tab:1": "tab1",
  tabF: "tabF",
  "edge-left": "edge-left",
  "edge-right": "edge-right",
  "edge-top": "edge-top",
  "edge-bottom": "edge-bottom",
  float: "float",
};

/** The spec's target in the host's vocabulary: what a callback payload names. */
const HOST_TARGET: Readonly<Record<string, string>> = {
  tab0: "tabset0",
  tab1: "tabset1",
  tabF: "tabsetF",
  float: "float",
  "edge-left": "edge-left",
  "edge-right": "edge-right",
  "edge-top": "edge-top",
  "edge-bottom": "edge-bottom",
};

const hostTarget = (target: string): string => HOST_TARGET[target] ?? target;

/**
 * Workspace vocabulary <-> `specs/patterns/workspace.qnt`. A drop is `drop` with
 * the target as data (`tab:0`, `tab:1`, `tabF`, `edge-left` ... `edge-bottom`,
 * `float`), which is exactly the spec's `target` var; the host maps a pointer
 * position to that string and the model never sees a pixel. `pick` is
 * pointerdown on a tab, `cancel` is pointerup with no target, `copy` is a drop
 * that duplicates and names the same target, `close` / `transferOut` / `attach`
 * name the tab in hand, `dock` is the host docking the floating tabset and
 * `collapse` toggles one docked tabset.
 */
export const workspaceBridge: SpecBridge = {
  setup: (config) => {
    const c = workspaceConfig(config);
    return c.keepWhenEmpty ? [specEvent("keepOn")] : [];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "pick":
        return [specEvent(`pick${tabIndex(step.target)}`)];
      case "drop": {
        const tag = DROP_EVENTS[step.target ?? ""];
        if (tag === undefined) {
          throw new Unsupported(`target ${step.target ?? ""}`);
        }
        return [specEvent(tag)];
      }
      case "cancel":
        return [specEvent("cancel")];
      case "close":
        return [specEvent("closeTab")];
      case "copy": {
        // a copy names its destination like a drop does; the spec takes it as data
        const dest = SPEC_TARGET[step.target ?? ""];
        if (dest === undefined) {
          throw new Unsupported(`target ${step.target ?? ""}`);
        }
        return [specEvent("copyTab", { dest })];
      }
      case "transferOut":
        return [specEvent("transferOut")];
      case "attach":
        return [specEvent("attach")];
      case "dock":
        return [specEvent("dockFloat")];
      case "collapse":
        return [specEvent(`collapse${tabsetIndex(step.target)}`)];
      case "hover":
      case "unhover":
        return [];
      case "prop":
        switch (step.prop) {
          case "keepWhenEmpty":
            // set at mount: the model has no transition that turns the policy off
            if (step.value === true) {
              return [specEvent("keepOn")];
            }
            throw new Unsupported(`keepWhenEmpty ${JSON.stringify(step.value)}`);
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) =>
    [num(state["where0"]), num(state["where1"]), num(state["where2"]), num(state["where3"])].map(
      (home) => HOMES[home] ?? "closed",
    ),
  focus: (state) => {
    const picked = num(state["drag"]);
    return picked < 0 ? null : `tab:${picked}`;
  },
  attr: (state, target, name) => {
    if (target.startsWith("tab:")) {
      const index = tabIndex(target);
      const home = num(state[`where${index}`] ?? 0n);
      const active = [
        num(state["active0"]),
        num(state["active1"]),
        num(state["activeF"]),
        num(state["activeE"]),
      ];
      switch (name) {
        case "data-home":
          return HOMES[home] ?? "closed";
        case "aria-selected":
          return String(active[home] === index);
        default:
          throw new Unsupported(`attribute ${name} on ${target}`);
      }
    }
    switch (target) {
      case "tabset:0":
      case "tabset:1":
      case "tabset:F":
      case "tabset:E": {
        const count = [0, 1, 2, 3].filter(
          (index) =>
            num(state[`where${index}`] ?? 0n) ===
            (target === "tabset:0" ? 0 : target === "tabset:1" ? 1 : target === "tabset:F" ? 2 : 3),
        ).length;
        const open =
          target === "tabset:0"
            ? state["exists0"] === true
            : target === "tabset:1"
              ? state["exists1"] === true
              : target === "tabset:F"
                ? state["floatOn"] === true
                : text(state["side"]) !== "none";
        switch (name) {
          case "data-tabs":
            return String(count);
          case "data-open":
            return String(open);
          case "data-side":
            return text(state["side"]);
          default:
            throw new Unsupported(`attribute ${name} on ${target}`);
        }
      }
      default:
        throw new Unsupported(`part ${target}`);
    }
  },
  visible: (state) =>
    [
      [0, "tab:0"],
      [1, "tab:1"],
      [2, "tab:2"],
      [3, "tab:3"],
    ]
      .filter(([index]) => num(state[`where${index}`] ?? 0n) < 4)
      .map(([, name]) => String(name))
      .concat(
        ["tabset:0", "tabset:1", "tabset:F", "tabset:E"].filter(
          (target) => workspaceBridge.attr(state, target, "data-open") === "true",
        ),
      ),
  events: (before, after) => {
    const fired: Array<readonly [string, Schema.Json]> = [];
    const homes = (state: QuintModelValue): ReadonlyArray<Schema.Json> =>
      [0, 1, 2, 3].map((index) => HOMES[num(state[`where${index}`] ?? 0n)] ?? "closed");
    const was = homes(before);
    const now = homes(after);
    if (JSON.stringify(was) !== JSON.stringify(now)) {
      fired.push(["onTabsChange", [...now]]);
    }
    if (num(after["copies"]) !== num(before["copies"])) {
      // the destination the model recorded, not a pinned one
      fired.push(["onCopy", [num(before["drag"]), hostTarget(text(after["copyTo"]))]]);
    }
    if (
      before["collapsed0"] !== after["collapsed0"] ||
      before["collapsed1"] !== after["collapsed1"]
    ) {
      fired.push(["onCollapse", [after["collapsed0"] === true, after["collapsed1"] === true]]);
    }
    if (before["floatOn"] !== after["floatOn"]) {
      fired.push(["onFloatingChange", [after["floatOn"] === true]]);
    }
    const closed = now.flatMap((home, index) =>
      home === "closed" && was[index] !== "closed" ? [index] : [],
    );
    if (closed.length > 0) {
      fired.push(["onClose", closed]);
    }
    const left = now.flatMap((home, index) =>
      home === "out" && was[index] !== "out" ? [index] : [],
    );
    const came = now.flatMap((home, index) =>
      home !== "out" && was[index] === "out" ? [index] : [],
    );
    if (left.length > 0 || came.length > 0) {
      fired.push(["onTransfer", [...left, ...came]]);
    }
    return fired;
  },
};

/** The user-level steps a differential walk draws from. */
export const workspaceSteps: ReadonlyArray<ActionStep> = [
  { event: "pick", target: "tab:0" },
  { event: "pick", target: "tab:1" },
  { event: "pick", target: "tab:2" },
  { event: "pick", target: "tab:3" },
  { event: "drop", target: "tab:0" },
  { event: "drop", target: "tab:1" },
  { event: "drop", target: "tabF" },
  { event: "drop", target: "edge-left" },
  { event: "drop", target: "edge-right" },
  { event: "drop", target: "edge-top" },
  { event: "drop", target: "edge-bottom" },
  { event: "drop", target: "float" },
  { event: "cancel" },
  // a copy names its destination, so the walk must not pass with a pinned one
  { event: "copy", target: "tab:1" },
  { event: "copy", target: "tabF" },
  { event: "copy", target: "edge-left" },
  { event: "close" },
  { event: "transferOut" },
  { event: "attach" },
  { event: "dock" },
  { event: "collapse", target: "tabset:0" },
  { event: "collapse", target: "tabset:1" },
  { event: "prop", prop: "keepWhenEmpty", value: true },
];

export const workspaceProbe: Probe = {
  attrs: [
    ["tab:0", "data-home"],
    ["tab:1", "data-home"],
    ["tab:2", "data-home"],
    ["tab:3", "data-home"],
    ["tab:0", "aria-selected"],
    ["tab:1", "aria-selected"],
    ["tab:2", "aria-selected"],
    ["tab:3", "aria-selected"],
    ["tabset:0", "data-tabs"],
    ["tabset:1", "data-tabs"],
    ["tabset:F", "data-tabs"],
    ["tabset:E", "data-tabs"],
    ["tabset:F", "data-open"],
  ],
  events: ["onTabsChange", "onCopy", "onCollapse", "onFloatingChange", "onClose", "onTransfer"],
  value: true,
};
