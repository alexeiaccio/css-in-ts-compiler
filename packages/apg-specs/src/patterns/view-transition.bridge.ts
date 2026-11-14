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

const num = (value: QuintModelValue[string] | undefined): number =>
  value === undefined ? 0 : Number(value);

/** The host's motion preference: the spec's `animate` / `inert` mode. */
export type ViewTransitionMotion = "full" | "reduce";

/**
 * Scenario `config` -> what both targets are mounted with. The spec models one
 * runner and one mode; the only knob is the motion preference. It is the
 * scenario's whole config because the primitive has no other option the spec
 * observes (the prefix and the style objects are not runner state).
 */
export interface ViewTransitionConfig {
  readonly motion: ViewTransitionMotion;
}

export const viewTransitionConfig = (config: ScenarioConfig): ViewTransitionConfig => {
  let motion: ViewTransitionMotion = "full";
  for (const [key, raw] of Object.entries(config)) {
    if (key === "motion" && (raw === "full" || raw === "reduce")) {
      motion = raw;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return { motion };
};

/**
 * View transition vocabulary <-> `specs/patterns/view-transition.qnt`. Parts:
 * `run` (the button that calls `run`), `surface` (the `persist` element) and
 * `pair` (the `name` element). `run` is the host's request; `settle` and `abort`
 * are the platform finishing or skipping the running transition, which a DOM
 * test drives through the stub. `prop motion` is the host changing its
 * preference; a scenario only changes it while idle (the model reads the mode
 * when a request starts).
 */
export const viewTransitionBridge: SpecBridge = {
  setup: (config) =>
    viewTransitionConfig(config).motion === "reduce" ? [specEvent("inertOn")] : [],
  event: (step: ActionStep) => {
    switch (step.event) {
      case "run":
        return [specEvent("request")];
      case "settle":
        return [specEvent("settle")];
      case "abort":
        return [specEvent("abort")];
      case "prop":
        if (step.prop === "motion" && (step.value === "full" || step.value === "reduce")) {
          return [specEvent(step.value === "reduce" ? "inertOn" : "inertOff")];
        }
        throw new Unsupported(`prop ${step.prop ?? ""}=${JSON.stringify(step.value)}`);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: () => null,
  visible: () => ["run", "surface", "pair"],
  attr: (_state, target, name) => {
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  // The runner's observables: the mode, whether a transition runs, and the
  // counters. The update count is the model's point, so it is compared too.
  value: (state) => [
    state["mode"] === "animate" ? "full" : "reduce",
    state["phase"] === "active",
    num(state["requests"]),
    num(state["updates"]),
    num(state["starts"]),
    num(state["finished"]),
    num(state["skips"]),
  ],
  events: () => [],
};

/**
 * The user-level steps a differential walk draws from. The mode is fixed per
 * walk (`config.motion`), so no `prop motion` here: the spec's mode change is
 * only modelled while idle, and a random walk must not race a running one.
 */
export const viewTransitionSteps: ReadonlyArray<ActionStep> = [
  { event: "run", target: "run" },
  { event: "settle" },
  { event: "abort" },
];

export const viewTransitionProbe: Probe = {
  attrs: [],
  value: true,
  events: [],
};
