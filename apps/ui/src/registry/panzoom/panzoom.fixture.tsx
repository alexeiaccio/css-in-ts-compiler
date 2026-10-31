import { render } from "@solidjs/web";

import { Panzoom } from "./panzoom.tsx";

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

/** What a mounted demo hands the test: where it lives and a teardown. */
export interface MountedPanzoom {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/**
 * Mounts the styled pan-zoom in ordinary use: a wide landscape in a 480 px frame on the surface, the value and the three
 * controls under it, and the hint that says what the pointer and the keys do. The primitive owns the gestures.
 */
export const mountPanzoom = (): MountedPanzoom => {
  const root = document.createElement("div");
  // the wrapper is the page: a width the frame fills, so the test's geometry does not depend on the browser's viewport
  root.style.width = `${FRAME_WIDTH}px`;
  document.body.append(root);
  const dispose = render(
    () => (
      <Panzoom
        src={PANZOOM_IMAGE}
        alt="A mountain lake at dusk"
        width={PANZOOM_WIDTH}
        height={PANZOOM_HEIGHT}
        label="A mountain lake at dusk"
      />
    ),
    root,
  );
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
