// The carousel's stories: a page hands in the slides, so each story composes its own. The two modes the frame has are
// auto-rotation (on by default, as in the primitive) and the paused carousel a reduced-motion reader gets. The drawings are
// gradients, so the example fetches nothing; the slides are built inside `render` because a JSX element is a DOM node and
// two stories sharing one would move it.
import type { JSX } from "@solidjs/web";

import type { Meta, Story } from "@cssints/stories";
import { Carousel } from "./carousel.tsx";

interface Slide {
  readonly caption: string;
  /** The two ends of the slide's gradient. */
  readonly from: string;
  readonly to: string;
}

const SLIDES: ReadonlyArray<Slide> = [
  {
    caption: "The first slide is the one the carousel shows at mount.",
    from: "#f7c59f",
    to: "#ef8354",
  },
  {
    caption: "Next and previous move one slide, and so do the arrow keys on a focused slide.",
    from: "#b8d8ba",
    to: "#4f7d63",
  },
  {
    caption:
      "The dots below are the indicator: a click shows that slide, the count says where it is.",
    from: "#a8d1e7",
    to: "#3a6ea5",
  },
  {
    caption:
      "Auto-rotation pauses on hover and on focus, and the rotation control stops it for good.",
    from: "#c3b1e1",
    to: "#6d597a",
  },
  {
    caption:
      "The last slide wraps to the first with Next: the primitive never disables the control.",
    from: "#3d405b",
    to: "#1b1b2f",
  },
];

const drawingStyle = (slide: Slide): JSX.CSSProperties => ({
  display: "flex",
  "align-items": "flex-end",
  height: "160px",
  padding: "12px",
  background: `linear-gradient(135deg, ${slide.from}, ${slide.to})`,
});

const numeralStyle: JSX.CSSProperties = {
  color: "rgb(255 255 255 / 0.85)",
  "font-size": "40px",
  "font-weight": "700",
  "line-height": "1",
};

const captionStyle: JSX.CSSProperties = {
  margin: "0",
  padding: "12px",
  "min-height": "64px",
  color: "var(--color-text)",
  "font-size": "var(--font-size-sm)",
};

/** Fresh slides per story: an element inserted in one carousel would be moved into the next. */
const gallery = (): ReadonlyArray<JSX.Element> =>
  SLIDES.map((slide, index) => (
    <figure style={{ margin: "0", background: "var(--color-surface)" }}>
      <div style={drawingStyle(slide)}>
        <span aria-hidden="true" style={numeralStyle}>
          {index + 1}
        </span>
      </div>
      <figcaption style={captionStyle}>{slide.caption}</figcaption>
    </figure>
  ));

const meta = { title: "Carousel" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <div class="demo-carousel" style={{ width: "100%" }}>
      <Carousel label="A gallery of five slides" slides={gallery()} />
    </div>
  ),
};

// Auto-rotation off: the slide moves only when the reader asks — the buttons, the dots, or the arrow keys on a focused
// slide — and no interval runs.
export const Paused: Story = {
  render: () => (
    <div class="demo-carousel" style={{ width: "100%" }}>
      <Carousel label="A gallery of five slides" slides={gallery()} autoRotate={false} />
    </div>
  ),
};
