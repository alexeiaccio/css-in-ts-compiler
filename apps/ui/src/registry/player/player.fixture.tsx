import type { PlaybackAdapter, PlaybackAdapterEvent } from "@cssints/headless";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

import { Player } from "./player.tsx";

/** The demo's made-up duration: 1:30, so the time line reads long enough to see the minutes. */
export const PLAYER_DURATION = 90;

/** The demo's source. Nothing fetches it: the adapter is fake and the `<video>` loads no data. */
export const PLAYER_SOURCE = "demo/coast-at-dusk.mp4";

/** The video frame's shape: 3:2, as the demo's drawing is. */
export const PLAYER_ASPECT = "3 / 2";

/** The demo's drawn frame, an inline SVG: the example needs no image file and no network. */
const POSTER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4a63"/><stop offset=".55" stop-color="#c98d63"/><stop offset="1" stop-color="#f3d9b0"/></linearGradient></defs><rect width="600" height="400" fill="url(#sky)"/><circle cx="430" cy="150" r="46" fill="#fff3d6"/><path d="M0 280 Q120 220 260 275 T600 265 V400 H0Z" fill="#20364a"/><path d="M0 320 Q160 285 320 320 T600 315 V400 H0Z" fill="#16273a" opacity=".8"/></svg>`;

export const PLAYER_POSTER = `data:image/svg+xml,${encodeURIComponent(POSTER)}`;

/**
 * The demo's adapter: a `PlaybackAdapter` with no file behind it. It announces the duration at load, runs a clock while
 * playing (one tick every 200 ms) so Play visibly advances the seek and the time, and records every committed seek, which
 * is what the browser test reads: it drives the adapter the way the primitive's own oracle does, through the controls.
 */
export class DemoPlaybackAdapter implements PlaybackAdapter {
  /** Every commit the primitive handed over, in seconds. */
  readonly seeks: number[] = [];

  private readonly listeners = new Set<(event: PlaybackAdapterEvent) => void>();
  private readonly duration: number;
  private position = 0;
  private ticker: ReturnType<typeof setInterval> | undefined;
  private reachedEnd = false;

  constructor(duration = PLAYER_DURATION) {
    this.duration = duration;
  }

  load(): Promise<void> {
    this.emit({ type: "loadedmetadata", duration: this.duration });
    this.emit({ type: "canplay" });
    return Promise.resolve();
  }

  play(): Promise<void> {
    // a play after the end starts the film again, as the primitive's position does
    if (this.reachedEnd) {
      this.position = 0;
      this.reachedEnd = false;
    }
    this.startClock();
    return Promise.resolve();
  }

  pause(): void {
    this.stopClock();
  }

  seek(seconds: number): Promise<void> {
    this.seeks.push(seconds);
    this.position = Math.min(this.duration, Math.max(0, seconds));
    this.reachedEnd = false;
    this.emit({ type: "seeking" });
    this.emit({ type: "seeked" });
    return Promise.resolve();
  }

  setVolume(): void {
    // the demo plays no sound; the primitive's gain lands here and is dropped on purpose
  }

  setPlaybackRate(): void {}

  dispose(): void {
    this.stopClock();
    this.listeners.clear();
  }

  subscribe(listener: (event: PlaybackAdapterEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private startClock(): void {
    this.stopClock();
    this.ticker = setInterval(() => this.tick(), 200);
  }

  private stopClock(): void {
    if (this.ticker !== undefined) {
      clearInterval(this.ticker);
      this.ticker = undefined;
    }
  }

  private tick(): void {
    this.position = Math.min(this.duration, this.position + 0.2);
    this.emit({ type: "timeupdate", currentTime: this.position });
    if (this.position >= this.duration) {
      this.reachedEnd = true;
      this.stopClock();
      this.emit({ type: "ended" });
    }
  }

  private emit(event: PlaybackAdapterEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export interface PlayerExampleProps {
  readonly class?: string | undefined;
  /** A test passes its own adapter to read what the primitive asked it; the demo's own runs a clock. */
  readonly adapter?: PlaybackAdapter | undefined;
}

/**
 * The starter in ordinary use: a made-up film at a 3:2 frame, the control bar under it, and the sentence about the keys.
 * The adapter is the demo's own, so there is no media file: press Play and the clock moves the seek, the time and the fill.
 * A page copies this and swaps `DemoPlaybackAdapter` for its engine.
 */
export const PlayerExample = (props: PlayerExampleProps): JSX.Element => {
  const adapter = props.adapter ?? new DemoPlaybackAdapter();
  return (
    <Player
      class={props.class}
      adapter={adapter}
      src={PLAYER_SOURCE}
      poster={PLAYER_POSTER}
      aspect={PLAYER_ASPECT}
      label="A short film about the coast"
      title="The coast at dusk"
    />
  );
};

/** What a mounted demo hands the test: where it lives, the adapter it drives, and a teardown. */
export interface MountedPlayer {
  readonly root: HTMLElement;
  readonly adapter: DemoPlaybackAdapter;
  readonly dispose: () => void;
}

/** The demo's width, so the bar has the same room in every test run. */
const DEMO_WIDTH = 480;

/**
 * Mounts the styled player in ordinary use at a 480 px frame. The primitive owns the playback state and the controls'
 * semantics; the fixture is the page's media and its adapter.
 */
export const mountPlayer = (): MountedPlayer => {
  const root = document.createElement("div");
  root.style.width = `${DEMO_WIDTH}px`;
  document.body.append(root);
  const adapter = new DemoPlaybackAdapter();
  const dispose = render(() => <PlayerExample adapter={adapter} />, root);
  return {
    root,
    adapter,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
