import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  type SpecBridge,
  Unsupported,
} from "../scenario";
import type { QuintEvent, QuintValue } from "@quint-machine/core";
import type { Schema } from "effect";

// The spec's events are `{ _tag }` records by construction (quint-machine's QuintEvent).
// oxlint-disable-next-line automation/no-manual-tagged-construction
const specEvent = (
  tag: string,
  params: Record<string, bigint | string | boolean> = {},
): QuintEvent => ({ _tag: tag, ...params });

const num = (value: QuintValue | undefined): number => (value === undefined ? 0 : Number(value));

const mss = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;

/**
 * Player vocabulary <-> `specs/apg/player.qnt`, shared by the spec driver and
 * the DOM driver. `config.duration` seeds `loadedmetadata` so both start ready.
 * Parts: `surface`, `play`, `seek`, `volume`, `rate`, `mute`, `fullscreen`.
 * Adapter events arrive as `prop: emit` steps (e.g. `{ event: 'prop', prop:
 * 'emit', value: { type: 'ended' } }`), so the walk can advance the machine.
 *
 * `controlled` puts volume / muted / rate / fullscreen in a host; it accepts
 * every request (`accepts`, the default) or ignores them all. The `prop*`
 * steps are the host writing a controlled value (inert while uncontrolled).
 */
export interface PlayerConfig {
  readonly duration: number;
  readonly controlled: boolean;
  readonly accepts: boolean;
}

export const playerConfig = (config: ScenarioConfig): PlayerConfig => {
  let duration = 90;
  let controlled = false;
  let accepts = true;
  for (const [key, value] of Object.entries(config)) {
    if (key === "duration" && typeof value === "number") {
      duration = value;
    } else if (key === "controlled" && typeof value === "boolean") {
      controlled = value;
    } else if (key === "accepts" && typeof value === "boolean") {
      accepts = value;
    } else {
      throw new Unsupported(`config ${key}=${JSON.stringify(value)}`);
    }
  }
  return { duration, controlled, accepts };
};

const SEEK_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
]);
const SURFACE_KEYS = new Set(["Space", " ", "k", "K"]);

const partOf = (target: string | undefined): string =>
  (target ?? "").replace(/:0$/, "").toLowerCase();

const isRecord = (value: Schema.Json): value is Readonly<Record<string, Schema.Json>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const emitEvent = (value: Schema.Json | undefined): QuintEvent => {
  if (value === undefined || !isRecord(value)) {
    throw new Unsupported(`emit ${JSON.stringify(value)}`);
  }
  const type = value["type"];
  switch (type) {
    case "loadedmetadata":
      return specEvent("onLoadedMetadata", {
        d: BigInt(Number(value["duration"])),
      });
    case "canplay":
    case "playing":
    case "waiting":
    case "pause":
    case "ended":
    case "seeked":
    case "error":
      return specEvent(`on${type.charAt(0).toUpperCase()}${type.slice(1)}`);
    case "timeupdate":
      return specEvent("onTimeUpdate", {
        t: BigInt(Number(value["currentTime"])),
      });
    default:
      throw new Unsupported(`emit type ${String(type)}`);
  }
};

const programmatic = (
  prop: string | undefined,
  value: Schema.Json | undefined,
): ReadonlyArray<QuintEvent> => {
  switch (prop) {
    case "emit":
      return [emitEvent(value)];
    case "play":
      return [specEvent("play")];
    case "pause":
      return [specEvent("pause")];
    case "toggle":
      return [specEvent("togglePlay")];
    case "toggleMute":
      return [specEvent("toggleMute")];
    case "toggleFullscreen":
      return [specEvent("toggleFullscreen")];
    case "setVolume":
      return [specEvent("setVolume", { v: BigInt(Number(value)) })];
    case "setRate":
      return [specEvent("setRate", { r: BigInt(Number(value)) })];
    case "propVolume":
      return [specEvent("propVolume", { v: BigInt(Number(value)) })];
    case "propMuted":
      return [specEvent("propMuted", { m: value === true })];
    case "propRate":
      return [specEvent("propRate", { r: BigInt(Number(value)) })];
    case "propFullscreen":
      return [specEvent("propFullscreen", { f: value === true })];
    case "focus": {
      const scope = String(value);
      if (scope === "surface" || scope === "seek" || scope === "control") {
        return [specEvent("focusOn", { target: scope })];
      }
      throw new Unsupported(`focus ${scope}`);
    }
    default:
      throw new Unsupported(`prop ${prop ?? ""}`);
  }
};

export const playerBridge: SpecBridge = {
  setup: (config) => {
    const { duration, controlled, accepts } = playerConfig(config);
    return [
      specEvent("onLoadedMetadata", { d: BigInt(duration) }),
      ...(controlled ? [specEvent("control")] : []),
      ...(controlled && accepts ? [specEvent("acceptRequests")] : []),
    ];
  },
  event: (step: ActionStep) => {
    switch (step.event) {
      case "focus": {
        const part = partOf(step.target);
        if (part === "surface" || part === "seek" || part === "control") {
          return [specEvent("focusOn", { target: part })];
        }
        throw new Unsupported(`focus on ${part}`);
      }
      case "blur":
        return [specEvent("blur")];
      case "click": {
        const part = partOf(step.target);
        if (part === "play" || part === "playpause") {
          return [specEvent("togglePlay")];
        }
        if (part === "mute" || part === "volumebutton") {
          return [specEvent("toggleMute")];
        }
        if (part === "fullscreen") {
          return [specEvent("toggleFullscreen")];
        }
        throw new Unsupported(`click on ${part}`);
      }
      case "key": {
        const part = partOf(step.target);
        const key = step.key ?? "";
        if (part === "seek") {
          if (!SEEK_KEYS.has(key)) {
            throw new Unsupported(`key ${key} on seek`);
          }
          return [specEvent("focusOn", { target: "seek" }), specEvent("seekKey", { key })];
        }
        if (part === "surface") {
          if (SURFACE_KEYS.has(key)) {
            return [specEvent("focusOn", { target: "surface" }), specEvent("togglePlay")];
          }
          if (key === "ArrowLeft" || key === "ArrowRight") {
            return [
              specEvent("focusOn", { target: "surface" }),
              specEvent("surfaceSeekKey", { key }),
            ];
          }
          throw new Unsupported(`key ${key} on surface`);
        }
        throw new Unsupported(`key ${key} on ${part}`);
      }
      case "hover":
      case "unhover":
        return [];
      case "prop":
        return programmatic(step.prop, step.value);
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  },
  value: (state) => ({
    position: num(state["pos"]),
    duration: num(state["dur"]),
    paused: state["paused"] === true,
    ended: state["ended"] === true,
    muted: state["muted"] === true,
    rate: num(state["rate"]),
    fullscreen: state["full"] === true,
  }),
  focus: (state) => {
    const scope = state["focus"];
    if (scope === "surface" || scope === "seek") {
      return scope;
    }
    // a toolbar control's identity is not modelled; exclude it from comparison
    if (scope === "control") {
      throw new Unsupported("control focus is not modelled as a part");
    }
    return null;
  },
  attr: (state, target, name) => {
    const part = partOf(target);
    if (part === "play" || part === "playpause") {
      if (name === "aria-label") {
        return state["stage"] === "playing" || state["stage"] === "buffering" ? "Pause" : "Play";
      }
    } else if (part === "mute" || part === "volumebutton") {
      if (name === "aria-pressed") {
        return state["muted"] === true ? "true" : "false";
      }
    } else if (part === "fullscreen") {
      if (name === "aria-pressed") {
        return state["full"] === true ? "true" : "false";
      }
    } else if (part === "seek") {
      if (name === "aria-valuemin") {
        return "0";
      }
      if (name === "aria-valuenow") {
        return String(num(state["pos"]));
      }
      if (name === "aria-valuemax") {
        return String(num(state["dur"]));
      }
      if (name === "aria-valuetext") {
        return mss(num(state["pos"]));
      }
    } else if (part === "volume" && name === "aria-valuenow") {
      return String(num(state["vol"]));
    } else if (part === "rate" && name === "aria-valuenow") {
      return String(num(state["rate"]));
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  },
  visible: () => [],
  events: (before, after) => {
    const out: Array<readonly [string, Schema.Json]> = [];
    const plays = num(after["plays"]) - num(before["plays"]);
    for (let i = 0; i < plays; i += 1) {
      out.push(["onPlay", true]);
    }
    const pauses = num(after["pauses"]) - num(before["pauses"]);
    for (let i = 0; i < pauses; i += 1) {
      out.push(["onPause", true]);
    }
    const seeks = num(after["seeks"]) - num(before["seeks"]);
    for (let i = 0; i < seeks; i += 1) {
      out.push(["onSeek", num(after["pos"])]);
    }
    if (after["reqs"] !== before["reqs"]) {
      const ask = num(after["askNum"]);
      switch (after["reqKind"]) {
        case "volume":
          out.push(["onVolumeChange", ask]);
          break;
        case "muted":
          out.push(["onMutedChange", ask === 1]);
          break;
        case "rate":
          out.push(["onRateChange", ask]);
          break;
        case "fullscreen":
          out.push(["onFullscreenChange", ask === 1]);
          break;
        default:
          break;
      }
    }
    return out;
  },
};

/** The user-level steps a differential walk draws from. */
export const playerSteps: ReadonlyArray<ActionStep> = [
  { event: "focus", target: "surface" },
  { event: "focus", target: "seek" },
  { event: "key", key: "Space", target: "surface" },
  { event: "key", key: "k", target: "surface" },
  { event: "key", key: "ArrowRight", target: "surface" },
  { event: "key", key: "ArrowLeft", target: "surface" },
  { event: "key", key: "ArrowRight", target: "seek" },
  { event: "key", key: "PageUp", target: "seek" },
  { event: "key", key: "Home", target: "seek" },
  { event: "key", key: "End", target: "seek" },
  { event: "prop", prop: "emit", value: { type: "waiting" } },
  { event: "prop", prop: "emit", value: { type: "playing" } },
  {
    event: "prop",
    prop: "emit",
    value: { type: "timeupdate", currentTime: 30 },
  },
  { event: "prop", prop: "emit", value: { type: "ended" } },
  { event: "prop", prop: "emit", value: { type: "seeked" } },
  { event: "prop", prop: "setVolume", value: 40 },
  { event: "prop", prop: "toggleMute" },
  { event: "prop", prop: "setRate", value: 150 },
  { event: "prop", prop: "toggleFullscreen" },
  { event: "prop", prop: "setVolume", value: 25 },
  { event: "prop", prop: "setRate", value: 200 },
  { event: "prop", prop: "propVolume", value: 75 },
  { event: "prop", prop: "propMuted", value: true },
  { event: "prop", prop: "propMuted", value: false },
  { event: "prop", prop: "propRate", value: 50 },
  { event: "prop", prop: "propFullscreen", value: true },
  { event: "prop", prop: "propFullscreen", value: false },
];

export const playerProbe: Probe = {
  attrs: [
    ["play", "aria-label"],
    ["mute", "aria-pressed"],
    ["fullscreen", "aria-pressed"],
    ["volume", "aria-valuenow"],
    ["rate", "aria-valuenow"],
    ["seek", "aria-valuemin"],
    ["seek", "aria-valuenow"],
    ["seek", "aria-valuemax"],
    ["seek", "aria-valuetext"],
  ],
  events: [
    "onPlay",
    "onPause",
    "onSeek",
    "onVolumeChange",
    "onMutedChange",
    "onRateChange",
    "onFullscreenChange",
  ],
};
