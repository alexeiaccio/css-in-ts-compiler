import type { PanZoom as PanZoomController } from "@cssints/headless";
import { render } from "@solidjs/web";

import { Panzoom } from "./panzoom.tsx";
import type { FrameScheduler, PanzoomGlide } from "./panzoom-glide.ts";

/** The demo's image: a drawn landscape, so the fixture needs no network and no binary in the repository. */
const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cfe4f5"/>
      <stop offset="1" stop-color="#f3e3cf"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <circle cx="1180" cy="250" r="92" fill="#f4c66a"/>
  <path d="M0 700 L320 430 L640 700 Z" fill="#8fa6a0"/>
  <path d="M420 700 L820 350 L1220 700 Z" fill="#5f7f77"/>
  <path d="M1000 700 L1320 470 L1640 700 Z" fill="#7d968f"/>
  <path d="M0 760 Q400 690 800 740 T1600 730 V900 H0 Z" fill="#3d5a52"/>
</svg>`;

/** The image the demo and its test use, as a `data:` URI. */
export const PANZOOM_IMAGE = `data:image/svg+xml,${encodeURIComponent(SCENE)}`;

/** The image's natural size, which is also the frame's shape. */
export const PANZOOM_WIDTH = 1600;
export const PANZOOM_HEIGHT = 900;

/** The frame's width in the fixture, so the bounds a test reads are whole numbers. */
const FRAME_WIDTH = 480;

/** A frame queue the test drives: a stubbed `requestAnimationFrame`, so a glide is bounded and deterministic. */
export interface ManualFrames extends FrameScheduler {
  /** Run every frame that is queued now, after `ms` of the frame clock; the frames they schedule wait for the next step. */
  step(ms?: number): void;
  /** How many frames are queued. */
  pending(): number;
  /** Take the queued callbacks out (a frame the browser had already dispatched when its effect was cancelled). */
  take(): ReadonlyArray<(time: number) => void>;
}

/** A manual frame clock: `step` is a frame, and nothing runs by itself. */
export const createManualFrames = (): ManualFrames => {
  let next = 1;
  let time = 0;
  const queue = new Map<number, (time: number) => void>();
  return {
    request: (callback) => {
      const id = next;
      next += 1;
      queue.set(id, callback);
      return id;
    },
    cancel: (id) => {
      queue.delete(id);
    },
    step: (ms = 16.7) => {
      time += ms;
      const due = [...queue.values()];
      queue.clear();
      for (const callback of due) {
        callback(time);
      }
    },
    pending: () => queue.size,
    take: () => {
      const due = [...queue.values()];
      queue.clear();
      return due;
    },
  };
};

/** What a mounted demo hands the test: where it lives, the primitive, the glide and a teardown. */
export interface MountedPanzoom {
  readonly root: HTMLElement;
  readonly frames: ManualFrames;
  readonly panzoom: () => PanZoomController;
  readonly glide: () => PanzoomGlide;
  readonly dispose: () => void;
}

/** The variants a test mounts: the pan only exists above `min`, so a glide needs a frame that starts zoomed in. */
export interface MountPanzoomOptions {
  readonly defaultScale?: number;
  readonly bounds?: "clamp" | "free";
  readonly reducedMotion?: boolean;
}

/**
 * Mounts the styled pan-zoom in ordinary use: a wide landscape in a 480 px frame on the surface, the value and the three
 * controls under it, and the hint that says what the pointer and the keys do. The primitive owns the gestures; the glide
 * runs on a frame queue the test steps, so no loop is left to the browser.
 */
export const mountPanzoom = (options: MountPanzoomOptions = {}): MountedPanzoom => {
  const root = document.createElement("div");
  // the wrapper is the page: a width the frame fills, so the test's geometry does not depend on the browser's viewport
  root.style.width = `${FRAME_WIDTH}px`;
  document.body.append(root);
  const frames = createManualFrames();
  let panzoom: PanZoomController | undefined;
  let glide: PanzoomGlide | undefined;
  let disposed = false;
  const stop = render(
    () => (
      <Panzoom
        src={PANZOOM_IMAGE}
        alt="A mountain lake at dusk"
        width={PANZOOM_WIDTH}
        height={PANZOOM_HEIGHT}
        label="A mountain lake at dusk"
        defaultScale={options.defaultScale}
        bounds={options.bounds}
        reducedMotion={options.reducedMotion}
        frames={frames}
        onReady={(api) => {
          panzoom = api;
        }}
        onGlide={(api) => {
          glide = api;
        }}
      />
    ),
    root,
  );
  const need = <T,>(value: T | undefined, name: string): T => {
    if (value === undefined) {
      throw new Error(`panzoom: the ${name} did not mount`);
    }
    return value;
  };
  return {
    root,
    frames,
    panzoom: () => need(panzoom, "primitive"),
    glide: () => need(glide, "glide"),
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      stop();
      root.remove();
    },
  };
};
