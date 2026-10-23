import { type PlaybackAdapter, type PlaybackAdapterEvent, type Player, createPlayer } from "../src";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { PlayerConfig } from "@cssints/apg-specs/src/apg/player.bridge";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/** A `PlaybackAdapter` whose events the test drives by hand (`setProp('emit', …)`). */
class FakeAdapter implements PlaybackAdapter {
  private readonly listeners = new Set<(event: PlaybackAdapterEvent) => void>();

  constructor(private readonly duration: number) {}

  load(): Promise<void> {
    this.emit({ type: "loadedmetadata", duration: this.duration });
    this.emit({ type: "canplay" });
    return Promise.resolve();
  }

  play(): Promise<void> {
    return Promise.resolve();
  }

  pause(): void {}
  seek(): Promise<void> {
    return Promise.resolve();
  }
  setVolume(): void {}
  setPlaybackRate(): void {}
  dispose(): void {}

  subscribe(listener: (event: PlaybackAdapterEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: PlaybackAdapterEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

const asEvent = (value: Json | undefined): PlaybackAdapterEvent => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("emit needs an event object");
  }
  return value as PlaybackAdapterEvent;
};

/**
 * Renders `createPlayer` as surface + controls and exposes the `Mounted` the DOM
 * driver needs. Controlled, the fixture is the host: it keeps volume / muted /
 * rate / fullscreen in signals, passes them as props, and either writes every
 * request back (`accepts`) or ignores the callbacks.
 */
export const mountPlayer = (config: PlayerConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const adapter = new FakeAdapter(config.duration);
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const [volume, setVolume] = createSignal(100);
  const [muted, setMuted] = createSignal(false);
  const [rate, setRate] = createSignal(100);
  const [fullscreen, setFullscreen] = createSignal(false);
  // a controlled host writes its props; uncontrolled they are never passed in
  const own =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      if (config.controlled) {
        set(value);
      }
    };
  // a request: recorded, then written back only by a host that accepts
  const asked =
    <T extends Json>(name: string, set: (value: T) => void) =>
    (value: T) => {
      push(name, value);
      if (config.accepts) {
        set(value);
      }
    };
  let api: Player | undefined;

  const dispose = render(() => {
    const player = createPlayer({
      adapter,
      get volume() {
        return config.controlled ? volume() : undefined;
      },
      get muted() {
        return config.controlled ? muted() : undefined;
      },
      get rate() {
        return config.controlled ? rate() : undefined;
      },
      get fullscreen() {
        return config.controlled ? fullscreen() : undefined;
      },
      onVolumeChange: asked("onVolumeChange", setVolume),
      onMutedChange: asked("onMutedChange", setMuted),
      onRateChange: asked("onRateChange", setRate),
      onFullscreenChange: asked("onFullscreenChange", setFullscreen),
      onPlay: () => push("onPlay", true),
      onPause: () => push("onPause", true),
      onSeek: (seconds) => push("onSeek", seconds),
    });
    api = player;
    return (
      <div>
        <div data-part="surface" {...player.surfaceProps}>
          surface
        </div>
        <button data-part="play" {...player.playProps}>
          play
        </button>
        <div data-part="seek" {...player.seekProps} />
        <div data-part="volume" aria-valuenow={player.volume()} />
        <div data-part="rate" aria-valuenow={player.rate()} />
        <button data-part="mute" {...player.muteProps}>
          mute
        </button>
        <button data-part="fullscreen" {...player.fullscreenProps}>
          fullscreen
        </button>
      </div>
    );
  }, root);

  return {
    root,
    events,
    value: () => ({
      position: api?.position() ?? 0,
      duration: api?.duration() ?? 0,
      paused: api?.stage() !== "playing" && api?.stage() !== "buffering",
      ended: api?.stage() === "ended",
      muted: api?.muted() ?? false,
      rate: api?.rate() ?? 100,
      fullscreen: api?.fullscreen() ?? false,
    }),
    setProp: (name, value) => {
      switch (name) {
        case "emit":
          adapter.emit(asEvent(value));
          break;
        case "setVolume":
          api?.setVolume(Number(value));
          break;
        case "toggleMute":
          api?.toggleMute();
          break;
        case "setRate":
          api?.setRate(Number(value));
          break;
        case "toggleFullscreen":
          api?.toggleFullscreen();
          break;
        case "propVolume":
          own(setVolume)(Number(value));
          break;
        case "propMuted":
          own(setMuted)(value === true);
          break;
        case "propRate":
          own(setRate)(Number(value));
          break;
        case "propFullscreen":
          own(setFullscreen)(value === true);
          break;
        case "play":
          api?.play();
          break;
        case "pause":
          api?.pause();
          break;
        case "toggle":
          api?.togglePlay();
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
