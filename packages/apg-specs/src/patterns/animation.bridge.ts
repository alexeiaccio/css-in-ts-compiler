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
const specEvent = (tag: string): QuintEvent => ({ _tag: tag });

const num = (value: QuintModelValue[string] | undefined): number =>
  value === undefined ? 0 : Number(value);

const bool = (value: QuintModelValue[string] | undefined): boolean => value === true;

/**
 * Scenario `config` -> what both targets are mounted with. The only knob is the
 * motion preference: a real primitive reads
 * `matchMedia("(prefers-reduced-motion: reduce)")` once and takes the override
 * prop the config stands for. The debounce delay is any positive number — every
 * delay is the same machine — so it is not a knob.
 */
export interface AnimationConfig {
  readonly reducedMotion: boolean;
}

export const animationConfig = (config: ScenarioConfig): AnimationConfig => {
  let reducedMotion = false;
  for (const [key, raw] of Object.entries(config)) {
    if (key === "reducedMotion" && typeof raw === "boolean") {
      reducedMotion = raw;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(raw)}`);
    }
  }
  return { reducedMotion };
};

/**
 * Animated disclosure vocabulary <-> `specs/patterns/animation.qnt`. Parts:
 * `trigger` (the button) and `content` (the animated region).
 *
 * The user-level steps are the protocol's own events, not DOM events, because
 * the DOM half is a browser detail the machine does not model: `click` on the
 * trigger is `toggle`; `pointerEnter` / `pointerLeave` add an intent to the
 * debounce window (`hover_in` / `hover_out`) and `debounce` is the window's
 * timer firing; `finish` is the live effect's completion and `finishStale` the
 * completion of an effect that was cancelled (a WAAPI `Animation` whose
 * `finished` promise resolves after `cancel()`, or a `transitionend` that
 * arrives one flush late); `frame` is one animation frame (`tick`). A `prop`
 * write of `open` is a controlled host delivering an intent — the machine
 * starts after the intent is accepted — and `prop reducedMotion` is the media
 * preference (only `true`: the model latches the mode on).
 */
export const animationBridge: SpecBridge = {
  setup: (config) => {
    const c = animationConfig(config);
    return c.reducedMotion ? [specEvent("reduced_motion")] : [];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "click":
        if (step.target !== undefined && step.target !== "trigger") {
          throw new Unsupported(`click on ${step.target}`);
        }
        return [specEvent("toggle")];
      case "pointerEnter":
        return [specEvent("hover_in")];
      case "pointerLeave":
        return [specEvent("hover_out")];
      case "debounce":
        return [specEvent("debounce")];
      case "finish":
        return [specEvent("finish_live")];
      case "finishStale":
        return [specEvent("finish_stale")];
      case "frame":
        return [specEvent("tick")];
      case "hover":
      case "unhover":
        return [];
      case "prop":
        switch (step.prop) {
          case "open":
            if (step.value === true) {
              return [specEvent("open")];
            }
            if (step.value === false) {
              return [specEvent("close")];
            }
            throw new Unsupported(`open=${JSON.stringify(step.value)}`);
          case "reducedMotion":
            if (step.value === true) {
              return [specEvent("reduced_motion")];
            }
            // the model latches the mode on: there is no way back to motion
            throw new Unsupported(`reducedMotion=${JSON.stringify(step.value)}`);
          default:
            throw new Unsupported(`prop ${step.prop ?? ""}`);
        }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  // `logical` is what `aria-expanded` says (the exposed intent), `visual` the
  // box, `committed` what the machine has settled at, `progress` the box's
  // position on the spec's five-point grid, `optimistic` the split between the
  // exposed and the committed state. `visible` has its own attribute and is not
  // repeated here.
  value: (state) => ({
    open: bool(state["logical"]),
    state: String(state["visual"]),
    committed: String(state["committed"]),
    progress: num(state["progress"]),
    optimistic: bool(state["optimistic"]),
  }),
  focus: () => null,
  visible: () => [],
  attr: (state, target, name) => {
    switch (target.replace(/:0$/, "")) {
      case "trigger":
        switch (name) {
          case "aria-expanded":
            return bool(state["logical"]) ? "true" : "false";
          case "aria-controls":
            return "content";
          default:
            throw new Unsupported(`attribute ${name} on ${target}`);
        }
      case "content":
        switch (name) {
          case "data-state":
            return String(state["visual"]);
          case "hidden":
            // absent while the box is on screen, including the whole close
            return bool(state["visible"]) ? null : "true";
          default:
            throw new Unsupported(`attribute ${name} on ${target}`);
        }
      default:
        throw new Unsupported(`part ${target}`);
    }
  },
  events: () => [],
};

/** The user-level steps a differential walk draws from. */
export const animationSteps: ReadonlyArray<ActionStep> = [
  { event: "click", target: "trigger" },
  { event: "pointerEnter", target: "trigger" },
  { event: "pointerLeave", target: "trigger" },
  { event: "debounce" },
  { event: "frame" },
  { event: "finish" },
  { event: "finishStale" },
  { event: "prop", prop: "open", value: true },
  { event: "prop", prop: "open", value: false },
  { event: "prop", prop: "reducedMotion", value: true },
];

export const animationProbe: Probe = {
  attrs: [
    ["trigger", "aria-expanded"],
    ["trigger", "aria-controls"],
    ["content", "data-state"],
    ["content", "hidden"],
  ],
  value: true,
  events: [],
};
