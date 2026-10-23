import { createEffect, createSignal, onCleanup, onSettled } from "solid-js";
import { createControllable } from "./controllable";

/**
 * A playback engine the primitive drives. Mediabunny is one; the primitive
 * never imports a media library (`@cssints/headless` stays `solid-js`-only).
 * Event names mirror `HTMLMediaElement`; the primitive mirrors the generated
 * `specs/apg/player.qnt` machine.
 */
export type PlaybackAdapterEvent =
  | { readonly type: "loadedmetadata"; readonly duration: number }
  | {
      readonly type: "canplay" | "playing" | "pause" | "waiting" | "seeking" | "seeked" | "ended";
    }
  | { readonly type: "timeupdate"; readonly currentTime: number }
  | { readonly type: "ratechange"; readonly rate: number }
  | { readonly type: "error"; readonly cause: unknown };

export interface PlaybackAdapter {
  /** Open + decode; emits `loadedmetadata` once the duration is known. */
  load(src: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): Promise<void>;
  /** 0..1, already muted-resolved by the primitive. */
  setVolume(gain: number): void;
  setPlaybackRate(rate: number): void;
  dispose(): void;
  subscribe(listener: (event: PlaybackAdapterEvent) => void): () => void;
}

export type PlayerStage =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export interface PlayerOptions {
  readonly adapter: PlaybackAdapter;
  readonly src?: string;
  /**
   * The four preferences below follow the request/commit model (map ticket
   * `rt1p`): `<name>` + `on<Name>Change` to own one as a host, `default<Name>`
   * to start an uncontrolled one. A change callback is a request the host may
   * ignore. Transport (play / pause / seek) and the stage stay adapter-driven.
   */
  /** 0..100; slider value, applied as a squared gain. */
  readonly volume?: number | undefined;
  readonly defaultVolume?: number;
  readonly onVolumeChange?: (volume: number) => void;
  readonly muted?: boolean | undefined;
  readonly defaultMuted?: boolean;
  readonly onMutedChange?: (muted: boolean) => void;
  /** Percent: 50 | 100 | 150 | 200. */
  readonly rate?: number | undefined;
  readonly defaultRate?: number;
  readonly onRateChange?: (percent: number) => void;
  readonly fullscreen?: boolean | undefined;
  readonly defaultFullscreen?: boolean;
  readonly onFullscreenChange?: (fullscreen: boolean) => void;
  readonly onPlay?: () => void;
  readonly onPause?: () => void;
  readonly onSeek?: (seconds: number) => void;
  readonly onEnded?: () => void;
}

export interface PlayerSurfaceProps {
  readonly tabindex: number;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface PlayerButtonProps {
  readonly type: "button";
  readonly onClick: () => void;
  /** Keep a pointer click from stealing focus, so the spec's `focus` scope holds. */
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface PlayerPlayProps extends PlayerButtonProps {
  readonly "aria-label": "Play" | "Pause";
}

export interface PlayerToggleProps extends PlayerButtonProps {
  readonly "aria-pressed": "true" | "false";
}

export interface PlayerSeekProps {
  readonly role: "slider";
  readonly tabindex: number;
  readonly "aria-valuemin": number;
  readonly "aria-valuenow": number;
  readonly "aria-valuemax": number;
  readonly "aria-valuetext": string;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

export interface Player {
  readonly stage: () => PlayerStage;
  readonly position: () => number;
  readonly duration: () => number;
  readonly muted: () => boolean;
  readonly volume: () => number;
  readonly rate: () => number;
  readonly fullscreen: () => boolean;
  readonly focus: () => "none" | "surface" | "seek" | "control";
  readonly play: () => void;
  readonly pause: () => void;
  readonly togglePlay: () => void;
  readonly seek: (seconds: number) => void;
  readonly setVolume: (value: number) => void;
  readonly toggleMute: () => void;
  readonly setRate: (percent: number) => void;
  readonly toggleFullscreen: () => void;
  readonly surfaceProps: PlayerSurfaceProps;
  readonly playProps: PlayerPlayProps;
  readonly seekProps: PlayerSeekProps;
  readonly muteProps: PlayerToggleProps;
  readonly fullscreenProps: PlayerToggleProps;
}

const RATE_PERCENTS = [50, 100, 150, 200] as const;
const SURFACE_SEEK_SECONDS = 5;
const SEEK_STEP_SECONDS = 1;
const SEEK_PAGE_SECONDS = 15;

const clamp = (value: number, max: number): number => (value < 0 ? 0 : value > max ? max : value);

const mss = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;

/**
 * APG media player primitive on Solid 2: playback state + attribute objects.
 * The playback contract follows `specs/apg/player.qnt` (APG Slider seek +
 * HTMLMediaElement playback); the adapter is injected, so no media library and
 * no elements live here.
 */
export const createPlayer = (options: PlayerOptions): Player => {
  const [stage, setStage] = createSignal<PlayerStage>("loading");
  const [position, setPosition] = createSignal(0);
  const [duration, setDuration] = createSignal(0);
  const [known, setKnown] = createSignal(false);
  const [volume, requestVolume] = createControllable({
    value: () => options.volume,
    initial: options.defaultVolume ?? 100,
    onChange: () => options.onVolumeChange,
  });
  const [muted, requestMuted] = createControllable({
    value: () => options.muted,
    initial: options.defaultMuted ?? false,
    onChange: () => options.onMutedChange,
  });
  const [rate, requestRate] = createControllable({
    value: () => options.rate,
    initial: options.defaultRate ?? 100,
    onChange: () => options.onRateChange,
  });
  const [fullscreen, requestFullscreen] = createControllable({
    value: () => options.fullscreen,
    initial: options.defaultFullscreen ?? false,
    onChange: () => options.onFullscreenChange,
  });
  const [focus, setFocus] = createSignal<"none" | "surface" | "seek" | "control">("none");

  const isActive = (): boolean => stage() === "playing" || stage() === "buffering";
  const canPlay = (): boolean =>
    stage() === "ready" || stage() === "paused" || stage() === "ended" || stage() === "buffering";
  const moveTo = (seconds: number): void => {
    setPosition(clamp(seconds, duration()));
  };

  const play = (): void => {
    if (!canPlay()) {
      return;
    }
    if (stage() === "ended") {
      setPosition(0);
    }
    setStage("playing");
    options.onPlay?.();
    void options.adapter.play().catch(() => setStage("error"));
  };

  const pause = (): void => {
    if (!isActive()) {
      return;
    }
    setStage("paused");
    options.onPause?.();
    options.adapter.pause();
  };

  const togglePlay = (): void => {
    if (isActive()) {
      pause();
    } else {
      play();
    }
  };

  const commit = (seconds: number): void => {
    if (!known()) {
      return;
    }
    const target = clamp(seconds, duration());
    if (stage() === "ended") {
      setStage("paused");
    }
    moveTo(target);
    options.onSeek?.(target);
    void options.adapter.seek(target);
  };

  const setVolume = (value: number): void => {
    requestVolume(clamp(value, 100));
  };

  const toggleMute = (): void => {
    requestMuted(!muted());
  };

  const setRate = (percent: number): void => {
    if (!RATE_PERCENTS.includes(percent as (typeof RATE_PERCENTS)[number])) {
      return;
    }
    requestRate(percent);
  };

  const toggleFullscreen = (): void => {
    requestFullscreen(!fullscreen());
  };

  const onEvent = (event: PlaybackAdapterEvent): void => {
    switch (event.type) {
      case "loadedmetadata":
        setDuration(event.duration);
        setKnown(true);
        setPosition(0);
        setStage("ready");
        return;
      case "canplay":
        if (stage() === "loading") {
          setStage("ready");
        }
        return;
      case "waiting":
        if (stage() === "playing") {
          setStage("buffering");
        }
        return;
      case "playing":
        if (stage() === "buffering") {
          setStage("playing");
        }
        return;
      case "timeupdate":
        if (stage() === "playing") {
          moveTo(event.currentTime);
        }
        return;
      case "pause":
        if (isActive()) {
          setStage("paused");
        }
        return;
      case "ended":
        if (stage() === "playing") {
          setStage("ended");
          moveTo(duration());
          options.onEnded?.();
        }
        return;
      case "seeking":
      case "seeked":
        return;
      case "ratechange":
        requestRate(Math.round(event.rate * 100));
        return;
      case "error":
        setStage("error");
        return;
    }
  };

  const seekBy = (delta: number): void => {
    commit(position() + delta);
  };

  const surfaceKey = (event: KeyboardEvent): void => {
    const key = event.key;
    if (key === " " || key === "Spacebar" || key === "k" || key === "K") {
      togglePlay();
    } else if (key === "ArrowLeft") {
      seekBy(-SURFACE_SEEK_SECONDS);
    } else if (key === "ArrowRight") {
      seekBy(SURFACE_SEEK_SECONDS);
    } else if (key === "f" || key === "F") {
      toggleFullscreen();
    } else if (key === "m" || key === "M") {
      toggleMute();
    } else {
      return;
    }
    event.preventDefault();
  };

  const seekKey = (event: KeyboardEvent): void => {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        seekBy(-SEEK_STEP_SECONDS);
        break;
      case "ArrowRight":
      case "ArrowUp":
        seekBy(SEEK_STEP_SECONDS);
        break;
      case "PageUp":
        seekBy(SEEK_PAGE_SECONDS);
        break;
      case "PageDown":
        seekBy(-SEEK_PAGE_SECONDS);
        break;
      case "Home":
        commit(0);
        break;
      case "End":
        commit(duration());
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const button = (onPress: () => void) => ({
    onClick: onPress,
    onMouseDown: (event: MouseEvent) => {
      event.preventDefault();
    },
    onFocus: () => setFocus("control"),
    onBlur: () => setFocus("none"),
  });

  const unsubscribe = options.adapter.subscribe(onEvent);
  // the adapter follows the committed values, so a rejected request never reaches it
  createEffect(
    () => (muted() ? 0 : volume()),
    (value) => {
      options.adapter.setVolume((value / 100) ** 2);
    },
  );
  createEffect(rate, (percent) => {
    options.adapter.setPlaybackRate(percent / 100);
  });
  // after the first render: a synchronous emit during setup would write reactive
  // state inside an owned scope (Solid 2 forbids it)
  onSettled(() => {
    void options.adapter
      .load(options.src ?? "")
      .catch(() => onEvent({ type: "error", cause: "load failed" }));
  });
  onCleanup(() => {
    unsubscribe();
    options.adapter.dispose();
  });

  return {
    stage,
    position,
    duration,
    muted,
    volume,
    rate,
    fullscreen,
    focus,
    play,
    pause,
    togglePlay,
    seek: commit,
    setVolume,
    toggleMute,
    setRate,
    toggleFullscreen,
    surfaceProps: {
      tabindex: 0,
      onKeyDown: surfaceKey,
      onFocus: () => setFocus("surface"),
      onBlur: () => setFocus("none"),
    },
    playProps: {
      type: "button",
      ...button(togglePlay),
      get "aria-label"() {
        return isActive() ? "Pause" : "Play";
      },
    },
    seekProps: {
      role: "slider",
      tabindex: 0,
      "aria-valuemin": 0,
      get "aria-valuenow"() {
        return position();
      },
      get "aria-valuemax"() {
        return duration();
      },
      get "aria-valuetext"() {
        return mss(position());
      },
      onKeyDown: seekKey,
      onFocus: () => setFocus("seek"),
      onBlur: () => setFocus("none"),
    },
    muteProps: {
      type: "button",
      ...button(toggleMute),
      get "aria-pressed"() {
        return muted() ? "true" : "false";
      },
    },
    fullscreenProps: {
      type: "button",
      ...button(toggleFullscreen),
      get "aria-pressed"() {
        return fullscreen() ? "true" : "false";
      },
    },
  };
};
