// The pan-and-zoom's stories: the picture is a drawn landscape as a `data:` URI, so the story needs no image file and no
// network (the component's fixture draws the same scene). Above `min` the picture can leave the frame, so a story that
// wants something to pan starts zoomed in.
import type { Meta, Story } from "@cssints/stories";

import { Panzoom, type PanzoomProps } from "./panzoom.tsx";

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

const meta = {
  title: "Pan and zoom",
  component: Panzoom,
  args: {
    src: `data:image/svg+xml,${encodeURIComponent(SCENE)}`,
    alt: "A mountain lake at dusk",
    width: 1600,
    height: 900,
    label: "A mountain lake at dusk",
  },
  argTypes: {
    defaultScale: { type: "range", min: 1, max: 4, step: 0.25 },
    min: { type: "number" },
    max: { type: "number" },
    step: { type: "number" },
    bounds: { type: "select", options: ["clamp", "free"] },
    label: { type: "text" },
  },
} satisfies Meta<PanzoomProps>;
export default meta;

export const Default: Story<PanzoomProps> = {};

// `bounds="clamp"` covers the frame at `min`, so there is nothing to pan until the picture is zoomed.
export const ZoomedIn: Story<PanzoomProps> = {
  name: "Zoomed in",
  args: { defaultScale: 2.5 },
};

// The other bound: the picture may leave the frame, which is what a letterboxed image needs.
export const FreeBounds: Story<PanzoomProps> = {
  name: "Free bounds",
  args: { defaultScale: 2, bounds: "free" },
};
