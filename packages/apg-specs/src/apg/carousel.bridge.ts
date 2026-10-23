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
const specEvent = (tag: string, params: Record<string, boolean | bigint> = {}): QuintEvent => ({
  _tag: tag,
  ...params,
});

/** The generator caps the modelled carousel at three slides. */
const SLIDES = 3;

type Part = { readonly kind: string; index: number };

const partOf = (target: string | undefined): Part => {
  const [name = "carousel", indexText] = (target ?? "carousel").split(":");
  return { kind: name, index: Number(indexText ?? "0") };
};

export interface CarouselConfig {
  /** DOM slide count (the generated model caps at three; the page may render more). */
  readonly items: number;
  /** Spec slide count (1..3). */
  readonly slides: number;
  /** DOM shown slide (`initialIndex`, for the page). */
  readonly initialIndex: number;
  /** Spec current slide (`initialIndex % slides`). */
  readonly index: number;
  readonly tabbed: boolean;
  readonly autoRotate: boolean;
  readonly playing: boolean;
  readonly hovering: boolean;
  readonly reducedMotion: boolean;
  readonly stickyFocusPause: boolean;
  readonly role: "region" | "group";
  readonly labelledBy: string | undefined;
  /** The host owns the shown slide (`value` prop present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned slide the host holds (rejects). */
  readonly pinned: number | null;
}

const bool = (key: string, value: ScenarioConfig[string]): boolean => {
  if (typeof value !== "boolean") {
    throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
  }
  return value;
};

/**
 * Scenario `config` -> what both targets are mounted with. The generated model
 * caps at three slides; a page may render more, so `items` is only clamped for
 * the spec side. `labelledBy` / `role` are static attributes the model does not
 * carry (the primitive still renders them).
 */
export const carouselConfig = (config: ScenarioConfig): CarouselConfig => {
  let items = 6;
  let tabbed = false;
  let autoRotate = true;
  let playing = true;
  let hovering = false;
  let reducedMotion = false;
  let stickyFocusPause = true;
  let role: "region" | "group" = "group";
  let initialIndex = 0;
  let labelledBy: string | undefined;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    if (key === "items") {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
        throw new Unsupported(`config items=${JSON.stringify(value)}`);
      }
      items = value;
    } else if (key === "variant") {
      if (value !== "basic" && value !== "tabbed") {
        throw new Unsupported(`config variant=${JSON.stringify(value)}`);
      }
      tabbed = value === "tabbed";
    } else if (key === "autoRotate") {
      autoRotate = bool(key, value);
    } else if (key === "playing") {
      playing = bool(key, value);
    } else if (key === "hovering") {
      hovering = bool(key, value);
    } else if (key === "reducedMotion") {
      reducedMotion = bool(key, value);
    } else if (key === "stickyFocusPause") {
      stickyFocusPause = bool(key, value);
    } else if (key === "focusInside") {
      bool(key, value);
    } else if (key === "role") {
      if (value !== "region" && value !== "group") {
        throw new Unsupported(`config role=${JSON.stringify(value)}`);
      }
      role = value;
    } else if (key === "initialIndex") {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Unsupported(`config initialIndex=${JSON.stringify(value)}`);
      }
      initialIndex = value;
    } else if (key === "labelledBy") {
      if (typeof value !== "string") {
        throw new Unsupported(`config labelledBy=${JSON.stringify(value)}`);
      }
      labelledBy = value;
    } else if (key === "controlled") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config controlled=${JSON.stringify(value)}`);
      }
      controlled ||= value;
    } else if (key === "value") {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Unsupported(`config value=${JSON.stringify(value)}`);
      }
      pinned = value;
      controlled = true;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  const slides = Math.min(items, SLIDES);
  if (pinned !== null && (pinned < 0 || pinned >= slides)) {
    throw new Unsupported(`value ${pinned} is not a slide`);
  }
  return {
    items,
    slides,
    initialIndex: initialIndex % items,
    index: initialIndex % slides,
    tabbed,
    autoRotate,
    playing,
    hovering,
    reducedMotion,
    stickyFocusPause,
    role,
    labelledBy,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

const rotating = (state: QuintModelValue): boolean =>
  state["autoRotate"] === true &&
  state["rotate"] === true &&
  (state["forced"] === true || (state["focus"] === 0n && state["hover"] !== true));

const focusSlot = (target: string | undefined): bigint => {
  const { kind } = partOf(target);
  if (kind === "rotation") {
    return 1n;
  }
  if (kind === "prev") {
    return 2n;
  }
  if (kind === "next") {
    return 3n;
  }
  if (kind === "tab") {
    return 4n;
  }
  if (kind === "slide") {
    return 7n;
  }
  throw new Unsupported(`focus on ${target ?? ""}`);
};

const ACTIVATION_KEYS = new Set(["Enter", " ", "Space"]);

/**
 * Carousel vocabulary <-> `specs/apg/carousel.qnt`, shared by the spec driver
 * and the DOM driver. Parts: `carousel` (container), `rotation`, `prev`,
 * `next`, `tab:i`, `slide:i`. A rotation interval is a `wait` of the example's
 * 5000 ms, one `tick` per interval.
 */
export const carouselBridge: SpecBridge = {
  setup: (config) => {
    const c = carouselConfig(config);
    const events: QuintEvent[] = [];
    if (c.slides !== SLIDES) {
      events.push(specEvent("set_slide_count", { m: BigInt(c.slides) }));
    }
    if (!c.autoRotate) {
      events.push(specEvent("set_auto_rotate", { on: false }));
    }
    if (c.tabbed) {
      events.push(specEvent("set_tabbed", { on: true }));
    }
    if (c.reducedMotion || !c.playing) {
      events.push(specEvent("set_reduced_motion"));
    }
    if (c.hovering) {
      events.push(specEvent("pointer_enter"));
    }
    if (c.controlled) {
      events.push(specEvent("control"));
      const initial = c.pinned ?? c.index;
      if (initial !== 0) {
        events.push(specEvent("setValue", { v: BigInt(initial) }));
      }
      if (c.accepts) {
        events.push(specEvent("acceptRequests"));
      }
    } else {
      for (let step = 0; step < c.index; step += 1) {
        events.push(specEvent("click_next"));
      }
    }
    return events;
  },
  event: (step) => {
    switch (step.event) {
      case "focus":
        return [specEvent("focus_control", { t: focusSlot(step.target) })];
      case "blur":
        return [specEvent("blur_out")];
      case "hover":
        return [specEvent("pointer_enter")];
      case "unhover":
        return [specEvent("pointer_leave")];
      case "click": {
        const { kind, index } = partOf(step.target);
        if (kind === "rotation") {
          return [specEvent("click_rotation")];
        }
        if (kind === "prev") {
          return [specEvent("click_prev")];
        }
        if (kind === "next") {
          return [specEvent("click_next")];
        }
        if (kind === "tab") {
          return [specEvent("click_tab", { i: BigInt(index) })];
        }
        throw new Unsupported(`click on ${step.target ?? ""}`);
      }
      case "key": {
        if (step.key === "Tab") {
          return [specEvent("key_tab")];
        }
        if (step.key === "Shift+Tab") {
          return [specEvent("key_shift_tab")];
        }
        const { kind } = partOf(step.target);
        const slot = focusSlot(step.target);
        if (step.key === "ArrowRight" && kind === "tab") {
          return [specEvent("focus_control", { t: slot }), specEvent("key_arrow_right")];
        }
        if (step.key === "ArrowLeft" && kind === "tab") {
          return [specEvent("focus_control", { t: slot }), specEvent("key_arrow_left")];
        }
        if (step.key === "Home" && kind === "tab") {
          return [specEvent("focus_control", { t: slot }), specEvent("key_home")];
        }
        if (step.key === "End" && kind === "tab") {
          return [specEvent("focus_control", { t: slot }), specEvent("key_end")];
        }
        if (
          step.key !== undefined &&
          ACTIVATION_KEYS.has(step.key) &&
          (kind === "rotation" || kind === "prev" || kind === "next")
        ) {
          return [specEvent("focus_control", { t: slot }), specEvent("key_activate")];
        }
        throw new Unsupported(`key ${step.key ?? ""} on ${step.target ?? ""}`);
      }
      case "wait": {
        const ms = step.ms ?? 0;
        if (ms < 5000 || ms % 5000 !== 0) {
          throw new Unsupported(`wait ${ms}`);
        }
        return Array.from({ length: ms / 5000 }, () => specEvent("tick"));
      }
      case "prop": {
        if (step.prop === "setValue") {
          const index = typeof step.value === "number" ? step.value : -1;
          if (!Number.isInteger(index) || index < 0 || index >= SLIDES) {
            throw new Unsupported(`setValue ${JSON.stringify(step.value)}`);
          }
          return [specEvent("setValue", { v: BigInt(index) })];
        }
        throw new Unsupported(`prop ${step.prop ?? ""}`);
      }
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  focus: (state) => {
    const slot = Number(state["focus"]);
    if (slot === 0) {
      return null;
    }
    if (slot === 1) {
      return "rotation";
    }
    if (slot === 2) {
      return "prev";
    }
    if (slot === 3) {
      return "next";
    }
    if (slot >= 4 && slot <= 6) {
      return `tab:${slot - 4}`;
    }
    return `slide:${state["current"]}`;
  },
  attr: (state, target, name) => {
    const { kind, index } = partOf(target);
    if (kind === "carousel") {
      if (name === "aria-roledescription") {
        return "carousel";
      }
      if (name === "aria-live") {
        return rotating(state) ? "off" : "polite";
      }
    } else if (kind === "rotation") {
      if (name === "aria-label") {
        return rotating(state) ? "Stop automatic slide show" : "Start automatic slide show";
      }
      if (name === "hidden") {
        return state["autoRotate"] === true ? null : "true";
      }
    } else if (kind === "slide") {
      if (name === "hidden") {
        return Number(state["current"]) === index ? null : "true";
      }
      if (name === "aria-roledescription") {
        return "slide";
      }
      if (name === "role") {
        return state["tabbed"] === true ? "tabpanel" : "group";
      }
    } else if (kind === "tab") {
      if (name === "aria-selected") {
        return Number(state["current"]) === index ? "true" : "false";
      }
      if (name === "tabindex") {
        return Number(state["current"]) === index ? null : "-1";
      }
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) => [`slide:${state["current"]}`],
  events: (before, after) =>
    before["requests"] === after["requests"]
      ? []
      : [["onIndexChange", Number(after["requested"])] as const],
};

/** The user-level steps a differential walk draws from. */
export const carouselSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "rotation" },
  { event: "focus", target: "prev" },
  { event: "focus", target: "next" },
  { event: "key", key: "Enter", target: "rotation" },
  { event: "key", key: " ", target: "rotation" },
  { event: "key", key: "Enter", target: "next" },
  { event: "key", key: " ", target: "prev" },
  { event: "wait", ms: 5000 },
  { event: "prop", prop: "setValue", value: 2 },
  { event: "prop", prop: "setValue", value: 0 },
];

export const carouselProbe: Probe = {
  attrs: [
    ["carousel", "aria-live"],
    ["carousel", "aria-roledescription"],
    ["rotation", "aria-label"],
    ["rotation", "hidden"],
    ["slide:0", "hidden"],
    ["slide:1", "hidden"],
    ["slide:2", "hidden"],
    ["tab:0", "aria-selected"],
    ["tab:1", "aria-selected"],
    ["tab:2", "aria-selected"],
  ],
  events: ["onIndexChange"],
};
