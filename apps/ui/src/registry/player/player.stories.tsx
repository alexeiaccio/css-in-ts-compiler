// The player's stories. The primitive drives a `PlaybackAdapter`, so a story has to hand it an engine: there is no film in
// this repository, so the adapter here wraps a real `<audio>` element playing a silent 90-second WAV made in the browser —
// a real media resource, just a quiet one. Play advances the time line and the seek, and a page swaps the adapter for its
// own (Mediabunny and the like); that is the whole contract. The frame's picture is drawn SVG, as the component's fixture
// draws it, because there is no video file to show either.
import type { PlaybackAdapter, PlaybackAdapterEvent } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { onCleanup } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { Player } from "./player.tsx";

const POSTER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4a63"/><stop offset=".55" stop-color="#c98d63"/><stop offset="1" stop-color="#f3d9b0"/></linearGradient></defs><rect width="600" height="400" fill="url(#sky)"/><circle cx="430" cy="150" r="46" fill="#fff3d6"/><path d="M0 280 Q120 220 260 275 T600 265 V400 H0Z" fill="#20364a"/><path d="M0 320 Q160 285 320 320 T600 315 V400 H0Z" fill="#16273a" opacity=".8"/></svg>`;

const RATE = 8000;
const SECONDS = 90;

/** A silent 8 kHz mono WAV, built in memory: `<audio>` reports its own duration, so the seek has a length. */
const silentWav = (): Blob => {
  const samples = RATE * SECONDS;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true); // the fmt chunk's size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // one channel
  view.setUint32(24, RATE, true); // samples a second
  view.setUint32(28, RATE, true); // bytes a second
  view.setUint16(32, 1, true); // block alignment
  view.setUint16(34, 8, true); // bits a sample
  text(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44); // 8-bit PCM is unsigned: 128 is silence
  return new Blob([bytes], { type: "audio/wav" });
};

/** The primitive's adapter over a media element: its events are the adapter's events, and it never fetches the page's URL. */
const mediaAdapter = (audio: HTMLAudioElement, source: string): PlaybackAdapter => {
  const listeners = new Set<(event: PlaybackAdapterEvent) => void>();
  const emit = (event: PlaybackAdapterEvent): void => {
    for (const listener of listeners) {
      listener(event);
    }
  };
  audio.addEventListener("loadedmetadata", () => {
    emit({ type: "loadedmetadata", duration: audio.duration });
  });
  audio.addEventListener("canplay", () => emit({ type: "canplay" }));
  audio.addEventListener("playing", () => emit({ type: "playing" }));
  audio.addEventListener("pause", () => emit({ type: "pause" }));
  audio.addEventListener("waiting", () => emit({ type: "waiting" }));
  audio.addEventListener("seeking", () => emit({ type: "seeking" }));
  audio.addEventListener("seeked", () => emit({ type: "seeked" }));
  audio.addEventListener("timeupdate", () => {
    emit({ type: "timeupdate", currentTime: audio.currentTime });
  });
  audio.addEventListener("ended", () => emit({ type: "ended" }));
  audio.addEventListener("error", () => emit({ type: "error", cause: audio.error }));

  return {
    // the made-up WAV, not the name the player was given: a real adapter opens `src`
    load: () => {
      audio.src = source;
      audio.load();
      return Promise.resolve();
    },
    play: () => audio.play(),
    pause: () => {
      audio.pause();
    },
    seek: (seconds) => {
      audio.currentTime = seconds;
      return Promise.resolve();
    },
    setVolume: (gain) => {
      audio.volume = gain;
    },
    setPlaybackRate: (rate) => {
      audio.playbackRate = rate;
    },
    dispose: () => {
      audio.pause();
      audio.removeAttribute("src");
      listeners.clear();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

interface PlayerExampleProps {
  readonly label: string;
  readonly title: string;
  readonly kind: "video" | "audio";
  readonly aspect: string;
}

const PlayerExample = (props: PlayerExampleProps): JSX.Element => {
  const source = URL.createObjectURL(silentWav());
  const audio = new Audio();
  const adapter = mediaAdapter(audio, source);
  onCleanup(() => {
    adapter.dispose();
    URL.revokeObjectURL(source);
  });
  return (
    <Player
      adapter={adapter}
      src="coast-at-dusk.wav"
      poster={`data:image/svg+xml,${encodeURIComponent(POSTER)}`}
      kind={props.kind}
      aspect={props.aspect}
      label={props.label}
      title={props.title}
    />
  );
};

const meta = {
  title: "Player",
  component: PlayerExample,
  args: {
    label: "A short film about the coast",
    title: "The coast at dusk",
    kind: "video",
    aspect: "3 / 2",
  },
  argTypes: {
    label: { type: "text" },
    title: { type: "text" },
    kind: { type: "select", options: ["video", "audio"] },
    aspect: { type: "select", options: ["3 / 2", "16 / 9"] },
  },
} satisfies Meta<PlayerExampleProps>;
export default meta;

export const Default: Story<PlayerExampleProps> = {};

// The audio bar: a waveform, the line the caller gives it, and no frame to fill.
export const AudioBar: Story<PlayerExampleProps> = {
  name: "Audio",
  args: { kind: "audio" },
};
