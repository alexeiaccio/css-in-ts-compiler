import { createFakeClock, type Clock } from "@cssints/machine";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

import { Carousel, type CarouselClockController } from "./carousel.tsx";

/** One slide of the demo: a drawing and the line a caption would say. */
export interface CarouselSlide {
  readonly title: string;
  readonly caption: string;
  /** The two ends of the slide's gradient. */
  readonly from: string;
  readonly to: string;
}

/** The gallery's five slides; the colours stand apart at a glance, so the change of slide is visible. */
export const CAROUSEL_SLIDES: ReadonlyArray<CarouselSlide> = [
  {
    title: "Dawn",
    caption: "The first slide is the one the carousel shows at mount.",
    from: "#f7c59f",
    to: "#ef8354",
  },
  {
    title: "Forest",
    caption: "Next and previous move one slide, and so do the arrow keys on a focused slide.",
    from: "#b8d8ba",
    to: "#4f7d63",
  },
  {
    title: "Ocean",
    caption:
      "The dots below are the indicator: a click shows that slide, the count says where it is.",
    from: "#a8d1e7",
    to: "#3a6ea5",
  },
  {
    title: "Dusk",
    caption:
      "The carousel is one tab stop: the shown slide takes the focus, the others are hidden.",
    from: "#c3b1e1",
    to: "#6d597a",
  },
  {
    title: "Night",
    caption:
      "The last slide wraps to the first with Next: the primitive never disables the control.",
    from: "#3d405b",
    to: "#1b1b2f",
  },
];

const figureStyle: JSX.CSSProperties = {
  margin: "0",
  "border-radius": "10px",
  overflow: "hidden",
  background: "#ffffff",
};

const drawingStyle = (slide: CarouselSlide): JSX.CSSProperties => ({
  display: "flex",
  "align-items": "flex-end",
  height: "200px",
  padding: "16px",
  "box-sizing": "border-box",
  background: `linear-gradient(135deg, ${slide.from}, ${slide.to})`,
});

const numeralStyle: JSX.CSSProperties = {
  color: "rgb(255 255 255 / 0.85)",
  "font-size": "48px",
  "font-weight": "700",
  "line-height": "1",
};

const captionStyle: JSX.CSSProperties = {
  margin: "0",
  padding: "16px",
  "min-height": "76px",
  "box-sizing": "border-box",
  color: "#3d3d3d",
  "font-size": "14px",
  "line-height": "1.5",
};

export interface CarouselExampleProps {
  readonly class?: string | undefined;
  /** Auto-rotation, on by default; `false` shows a paused carousel and no rotation control. */
  readonly autoRotate?: boolean | undefined;
  /** One rotation interval in ms; the component's constant by default. */
  readonly interval?: number | undefined;
  /** The motion preference; left out, `prefers-reduced-motion` is read once. */
  readonly reducedMotion?: boolean | undefined;
  /** The clock the machine's waits run on: a fake one in a test, the system one on a page. */
  readonly clock?: Clock | undefined;
  readonly onReady?: (controller: CarouselClockController) => void;
}

/**
 * The starter in ordinary use: five drawn slides on the neutral theme, the control row with its rotation control, its dots
 * and its count, and the sentence that says how the keyboard and a touch screen reach the slides. A page copies this and
 * swaps the figures for its own content.
 */
export const CarouselExample = (props: CarouselExampleProps): JSX.Element => {
  const slides = CAROUSEL_SLIDES.map((slide, index) => (
    <figure style={figureStyle}>
      <div style={drawingStyle(slide)}>
        <span aria-hidden="true" style={numeralStyle}>
          {index + 1}
        </span>
      </div>
      <figcaption style={captionStyle}>{slide.caption}</figcaption>
    </figure>
  ));
  return (
    <div class={props.class} style={{ width: "100%" }}>
      <Carousel
        label="A gallery of five slides"
        slides={slides}
        autoRotate={props.autoRotate}
        interval={props.interval}
        reducedMotion={props.reducedMotion}
        clock={props.clock}
        onReady={props.onReady}
      />
    </div>
  );
};

/** What a mounted demo hands the test: where it lives, the machine behind the rotation, and a teardown. */
export interface MountedCarousel {
  readonly root: HTMLElement;
  readonly controller: CarouselClockController;
  readonly dispose: () => void;
}

/** The demo's width, so the frame (and the slides) have the same shape in every test run. */
const DEMO_WIDTH = 480;

/**
 * Mounts the styled carousel in ordinary use at a 480 px frame. The primitive owns the shown slide, the requests and the
 * slide semantics; the fixture is the page's content.
 *
 * The clock is a fake one unless the caller passes another: the rotation then moves only when a test advances it, so a
 * claim about the interval never depends on how fast the test runs. `clock: systemClock` and a short `interval` is the
 * real-timer path, used once to prove the default.
 */
export const mountCarousel = (
  options: Omit<CarouselExampleProps, "onReady"> = {},
): MountedCarousel => {
  const clock = options.clock ?? createFakeClock();
  let controller: CarouselClockController | undefined;
  const root = document.createElement("div");
  root.style.width = `${DEMO_WIDTH}px`;
  document.body.append(root);
  const dispose = render(
    () => (
      <CarouselExample
        {...options}
        clock={clock}
        onReady={(ready) => {
          controller = ready;
        }}
      />
    ),
    root,
  );
  if (controller === undefined) {
    throw new Error("carousel: the clock did not report ready");
  }
  return {
    root,
    controller,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
