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

/** The spec's feed grows to at most six articles (fixed `totalArticles`). */
const MAX_LOADED = 6;

export interface FeedConfig {
  readonly loaded: number;
  readonly totalArticles: number | null;
  readonly sizeMode: "loaded" | "total";
  readonly totalKnown: boolean;
  readonly labelledBy: string | undefined;
  /** The host owns the loaded count (`value` prop present). */
  readonly controlled: boolean;
  /** Controlled only: the host writes every request's intent back. */
  readonly accepts: boolean;
  /** Controlled only: a pinned loaded count the host holds (rejects). */
  readonly pinned: number | null;
}

/**
 * Scenario `config` -> what both targets are mounted with. The generated model
 * fixes the server total at six articles, so a page total is only informational
 * for the spec side; `loaded` beyond six is not modelled and is `Unsupported`.
 */
export const feedConfig = (config: ScenarioConfig): FeedConfig => {
  let loaded = 1;
  let totalArticles: number | null = 6;
  let sizeMode: "loaded" | "total" = "loaded";
  let totalKnown = false;
  let labelledBy: string | undefined;
  let controlled = false;
  let pinned: number | null = null;
  for (const [key, value] of Object.entries(config)) {
    if (key === "loaded") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > MAX_LOADED
      ) {
        throw new Unsupported(`config loaded=${JSON.stringify(value)}`);
      }
      loaded = value;
    } else if (key === "totalArticles") {
      if (value !== null && (typeof value !== "number" || value < 1)) {
        throw new Unsupported(`config totalArticles=${JSON.stringify(value)}`);
      }
      totalArticles = value;
    } else if (key === "sizeMode") {
      if (value !== "loaded" && value !== "total") {
        throw new Unsupported(`config sizeMode=${JSON.stringify(value)}`);
      }
      sizeMode = value;
    } else if (key === "totalKnown") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config totalKnown=${JSON.stringify(value)}`);
      }
      totalKnown = value;
    } else if (key === "labelledby") {
      if (typeof value !== "string") {
        throw new Unsupported(`config labelledby=${JSON.stringify(value)}`);
      }
      labelledBy = value;
    } else if (key === "controlled") {
      if (typeof value !== "boolean") {
        throw new Unsupported(`config controlled=${JSON.stringify(value)}`);
      }
      controlled ||= value;
    } else if (key === "value") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > MAX_LOADED
      ) {
        throw new Unsupported(`config value=${JSON.stringify(value)}`);
      }
      pinned = value;
      controlled = true;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return {
    loaded,
    totalArticles,
    sizeMode,
    totalKnown,
    labelledBy,
    controlled,
    accepts: controlled && pinned === null,
    pinned,
  };
};

const articleIndex = (target: string): number => {
  const [name = "", indexText] = target.split(":");
  if (name !== "article") {
    throw new Unsupported(`part ${name}`);
  }
  const index = Number(indexText ?? "0");
  if (!Number.isInteger(index) || index < 1) {
    throw new Unsupported(`article ${target}`);
  }
  return index;
};

const programmatic = (step: ActionStep): ReadonlyArray<QuintEvent> => {
  switch (step.prop) {
    case "loadStart":
      return [specEvent("load_start")];
    case "loadFinish": {
      const n = typeof step.value === "number" ? step.value : 0;
      if (!Number.isInteger(n) || n < 1 || n > 3) {
        throw new Unsupported(`loadFinish ${JSON.stringify(step.value)}`);
      }
      return [specEvent("load_finish", { n: BigInt(n) })];
    }
    case "loadFail":
      return [specEvent("load_fail")];
    case "setValue": {
      const n = typeof step.value === "number" ? step.value : 0;
      if (!Number.isInteger(n) || n < 1 || n > MAX_LOADED) {
        throw new Unsupported(`setValue ${JSON.stringify(step.value)}`);
      }
      return [specEvent("setValue", { v: BigInt(n) })];
    }
    case "sizeMode":
      if (step.value !== "loaded" && step.value !== "total") {
        throw new Unsupported(`sizeMode ${JSON.stringify(step.value)}`);
      }
      return [specEvent("set_size_mode", { mode: step.value })];
    case "totalKnown":
      return [specEvent("set_total_known", { known: step.value === true })];
    default:
      throw new Unsupported(`prop ${step.prop ?? ""}`);
  }
};

/** The load batches that grow a fresh model to `target` articles. */
const batches = (target: number): ReadonlyArray<number> => {
  const out: number[] = [];
  let remaining = target - 1;
  while (remaining > 0) {
    const size = Math.min(remaining, 3);
    out.push(size);
    remaining -= size;
  }
  return out;
};

/** The focus event a step's target implies before its key acts (`key` first focuses). */
const focusEvents = (target: string | undefined): ReadonlyArray<QuintEvent> => {
  if (target === "before-feed") {
    return [specEvent("focus_outside", { side: "before" })];
  }
  if (target === "after-feed") {
    return [specEvent("focus_outside", { side: "after" })];
  }
  return [specEvent("focus_article", { n: BigInt(articleIndex(target ?? "")) })];
};

/**
 * Feed vocabulary <-> `specs/apg/feed.qnt`, shared by the spec driver and the
 * DOM driver. Parts: `feed`, `article:N` (aria-posinset N), and the
 * `before-feed` / `after-feed` focus sentinels for the two outside zones.
 */
export const feedBridge: SpecBridge = {
  setup: (config) => {
    const feed = feedConfig(config);
    const events: QuintEvent[] = [];
    for (const size of batches(feed.loaded)) {
      events.push(specEvent("load_start"));
      events.push(specEvent("load_finish", { n: BigInt(size) }));
    }
    if (feed.sizeMode === "total") {
      events.push(specEvent("set_size_mode", { mode: "total" }));
    }
    if (feed.totalKnown) {
      events.push(specEvent("set_total_known", { known: true }));
    }
    if (feed.controlled) {
      events.push(specEvent("control"));
      const initial = feed.pinned ?? feed.loaded;
      if (initial !== feed.loaded) {
        events.push(specEvent("setValue", { v: BigInt(initial) }));
      }
      if (feed.accepts) {
        events.push(specEvent("acceptRequests"));
      }
    }
    return events;
  },
  event: (step) => {
    switch (step.event) {
      case "focus": {
        if (step.target === "before-feed") {
          return [specEvent("focus_outside", { side: "before" })];
        }
        if (step.target === "after-feed") {
          return [specEvent("focus_outside", { side: "after" })];
        }
        return [
          specEvent("focus_article", {
            n: BigInt(articleIndex(step.target ?? "")),
          }),
        ];
      }
      case "key": {
        const focus = focusEvents(step.target);
        switch (step.key) {
          case "PageDown":
            return [...focus, specEvent("page_down")];
          case "PageUp":
            return [...focus, specEvent("page_up")];
          case "Control+End":
            return [...focus, specEvent("ctrl_end")];
          case "Control+Home":
            return [...focus, specEvent("ctrl_home")];
          default:
            throw new Unsupported(`key ${step.key ?? ""}`);
        }
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
  focus: (state) => {
    const zone = state["zone"];
    if (zone === "feed") {
      return `article:${state["focus"]}`;
    }
    if (zone === "before") {
      return "before-feed";
    }
    if (zone === "after") {
      return "after-feed";
    }
    return null;
  },
  attr: (state, target, name) => {
    if (target === "feed") {
      if (name === "aria-busy") {
        return state["busy"] === true ? "true" : null;
      }
      if (name === "role") {
        return "feed";
      }
    }
    const index = articleIndex(target);
    if (name === "aria-posinset") {
      return String(index);
    }
    if (name === "aria-setsize") {
      if (state["sizeMode"] === "loaded") {
        return String(state["loaded"]);
      }
      return state["totalKnown"] === true ? "6" : "-1";
    }
    if (name === "role") {
      return "article";
    }
    if (name === "tabindex") {
      return "0";
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: (state) => Array.from({ length: Number(state["loaded"]) }, (_, i) => `article:${i + 1}`),
  events: (before: QuintModelValue, after: QuintModelValue) =>
    before["requests"] === after["requests"]
      ? []
      : [["onLoadedChange", Number(after["requested"])] as const],
};

/** The user-level steps a differential walk draws from. */
export const feedSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "article:1" },
  { event: "focus", target: "article:2" },
  { event: "focus", target: "article:3" },
  { event: "key", key: "PageDown", target: "article:1" },
  { event: "key", key: "PageUp", target: "article:1" },
  { event: "key", key: "Control+End", target: "article:1" },
  { event: "key", key: "Control+Home", target: "article:1" },
  { event: "prop", prop: "loadFinish", value: 2 },
  { event: "prop", prop: "loadFail" },
  { event: "prop", prop: "sizeMode", value: "total" },
  { event: "prop", prop: "totalKnown", value: true },
  { event: "prop", prop: "setValue", value: 4 },
  { event: "prop", prop: "setValue", value: 2 },
];

export const feedProbe: Probe = {
  attrs: [
    ["feed", "aria-busy"],
    ["article:1", "aria-posinset"],
    ["article:1", "aria-setsize"],
    ["article:2", "aria-setsize"],
    ["article:3", "aria-setsize"],
  ],
  events: ["onLoadedChange"],
};
