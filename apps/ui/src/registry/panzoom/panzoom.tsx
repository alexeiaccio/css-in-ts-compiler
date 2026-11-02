import {
  createPanZoom,
  type PanZoom as PanZoomController,
  type PanZoomPoint,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createSignal, merge, untrack } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };
import { createPanzoomGlide, type FrameScheduler, type PanzoomGlide } from "./panzoom-glide.ts";

export interface PanzoomProps {
  /** The image: a URL, or a `data:` URI. */
  readonly src: string;
  /** The image's text alternative; the viewport's own name is `label`. */
  readonly alt: string;
  /** Its natural width, for the frame's shape; read from the image when both are left out. */
  readonly width?: number;
  /** Its natural height, for the frame's shape; read from the image when both are left out. */
  readonly height?: number;
  /** The viewport's accessible name: what the image shows, in the page's words (default `"Image"`). */
  readonly label?: string;
  /** The line under the frame; left out, the gestures and the keys in one sentence. */
  readonly hint?: string;
  /** Smallest scale, and where reset returns. @default 1 */
  readonly min?: number;
  /** Largest scale. @default 4 */
  readonly max?: number;
  /** The zoom buttons' and `+` / `-`'s increment. @default 0.25 */
  readonly step?: number;
  /** Starting scale when uncontrolled; ignored while `scale` is set. */
  readonly defaultScale?: number;
  /** Controlled: the host owns the scale and this is the only thing that changes it. */
  readonly scale?: number;
  readonly onScaleChange?: (scale: number) => void;
  readonly onPanChange?: (offset: PanZoomPoint) => void;
  /** `"clamp"` (default) keeps the scaled image covering the frame; `"free"` lets it leave. */
  readonly bounds?: "clamp" | "free";
  /** `prefers-reduced-motion: reduce`: a flick lands where the drag left it, with no glide. */
  readonly reducedMotion?: boolean;
  readonly class?: string;
  /** The primitive, once: a page that reads `scale()` or drives the camera. */
  readonly onReady?: (panzoom: PanZoomController) => void;
  /** The glide machine, once: a fixture sends a stale frame or reads the phase; a page rarely does. */
  readonly onGlide?: (glide: PanzoomGlide) => void;
  /** The glide's frame loop; the browser's by default, a test's queue in a test. */
  readonly frames?: FrameScheduler;
}

const DEFAULT_HINT =
  "Drag or flick to pan, pinch or Ctrl/⌘ + wheel to zoom. Keys: +, -, arrows and 0.";

/** The window a release's velocity is measured over: the last 100 ms of pointer samples. */
const GLIDE_VELOCITY_WINDOW = 100;
/** A shorter interval than this is not a velocity: a burst of synthetic moves in one task would read as a flick. */
const GLIDE_VELOCITY_FLOOR = 8;

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2), css.width("100%"));

// The frame is the box the primitive's maths assumes: the image fills it at `min` (object-fit: cover), its origin is the
// centre, and the clips are the rounded corners. `touch-action: none` is the touch drag; the pointer is the only gesture
// the primitive cannot replace with a key, so it is the only one the skin has to allow through.
const viewportClass = css.cn(
  css.position("relative"),
  css.display("block"),
  css.width("100%"),
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.bg(t.color.surface),
  css.touchAction("none"),
  css.userSelect("none"),
  css.cursor("grab"),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("data-dragging", "true")(css.cursor("grabbing")),
);

// The transform is the primitive's, inline: the transition is the skin's, and only for a reader who allows motion. A drag
// sets `data-dragging` on the image, and the attribute's higher specificity drops the transition while the pointer moves,
// so the picture follows the pointer instead of trailing it.
const imageClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.width("100%"),
  css.height("100%"),
  css.objectFit("cover"),
  css.transformOrigin("50% 50%"),
  css.userSelect("none"),
  css.pointerEvents("none"),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("transform 140ms ease-out"),
    css.attr("data-dragging", "true")(css.transition("none")),
    // the glide writes the transform on every frame: a transition would make it trail its own velocity
    css.within(css.attr("data-gliding", "true"))(css.transition("none")),
  ),
);

const barClass = css.cn(
  css.display("flex"),
  css.flexWrap("wrap"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

// The live region is visible, not hidden: the zoom is a number a reader may want to read, and a region that is on screen is
// also a region a screen reader has been watching.
const valueClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.fontVariantNumeric("tabular-nums"),
  css.color(t.color.text),
  css.minWidth(t.space._7),
);

const controlsClass = css.cn(css.display("flex"), css.flexWrap("wrap"), css.gap(t.space._2));

const hintClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));

/**
 * One image in a frame, styled: `createPanZoom` owns the scale, the offset, the pointer drag and pinch, the wheel, the
 * double click, the keys (+, -, arrows, 0) and the live value the viewport describes; the skin owns the surface and its
 * rounded corners, the focus ring, the value and the three buttons, the hint, and the glide.
 *
 * A fast flick leaves the picture moving: the pointer's last 100 ms are measured on release, and `panzoom-glide.ts` runs
 * the momentum as a machine — one frame per effect, `panBy` on the primitive, a grab that takes the picture back from
 * the frame it is on, a key or a double click that stops it, and no loop at all under reduced motion. The offset stays
 * the primitive's; the machine carries the velocity and `data-gliding` reads the phase.
 *
 * The frame's shape comes from `width` / `height` (or the image's own natural size once it loads), and the image fills it
 * with `object-fit: cover`, which is what the primitive's clamp assumes. A page that needs a letterboxed image passes
 * `bounds="free"`.
 */
export const Panzoom = (props: PanzoomProps): JSX.Element => {
  const panzoom = createPanZoom({
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get step() {
      return props.step;
    },
    defaultScale: props.defaultScale,
    get scale() {
      return props.scale;
    },
    get bounds() {
      return props.bounds;
    },
    get onScaleChange() {
      return props.onScaleChange;
    },
    get onPanChange() {
      return props.onPanChange;
    },
    get labels() {
      return props.label === undefined ? undefined : { viewport: props.label };
    },
  });
  // a structural prop, read once: it is the primitive for a page, not a signal
  untrack(() => props.onReady)?.(panzoom);

  // The glide is the skin's: the primitive owns the drag and the offset, and has no way to move the pan from outside,
  // so it gains `panBy` for this. The machine's context is the velocity only.
  const glide = createPanzoomGlide({
    panzoom,
    reducedMotion: untrack(() => props.reducedMotion),
    frames: untrack(() => props.frames),
  });
  untrack(() => props.onGlide)?.(glide);

  // Velocity sampling is the skin's, not the primitive's: the last 100 ms of pointer samples decide a fling, a hold
  // before the lift is no velocity, and a second pointer is a pinch, not a flick.
  const samples: { at: number; x: number; y: number }[] = [];
  const pointers = new Set<number>();
  let pinched = false;

  const sample = (event: PointerEvent): void => {
    samples.push({ at: event.timeStamp, x: event.clientX, y: event.clientY });
    while (samples.length > 1) {
      const head = samples[0];
      if (head === undefined || event.timeStamp - head.at <= GLIDE_VELOCITY_WINDOW) {
        break;
      }
      samples.shift();
    }
  };

  /** The release's velocity, in px/ms: the window's own span, or none when the pointer rested before it lifted. */
  const velocity = (timeStamp: number): PanZoomPoint => {
    const head = samples[0];
    const tail = samples.at(-1);
    const age = tail === undefined ? Number.POSITIVE_INFINITY : timeStamp - tail.at;
    const elapsed = head === undefined || tail === undefined ? 0 : tail.at - head.at;
    if (
      age > GLIDE_VELOCITY_WINDOW ||
      elapsed <= GLIDE_VELOCITY_FLOOR ||
      head === undefined ||
      tail === undefined
    ) {
      return { x: 0, y: 0 };
    }
    return { x: (tail.x - head.x) / elapsed, y: (tail.y - head.y) / elapsed };
  };

  // the natural size, until the image has loaded and told us; 16:10 is the shape of a frame with nothing to go on
  const [natural, setNatural] = createSignal({ width: 16, height: 10 });
  const size = () => ({
    width: props.width ?? natural().width,
    height: props.height ?? natural().height,
  });
  const readNatural = (event: Event & { readonly currentTarget: HTMLImageElement }): void => {
    const image = event.currentTarget;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setNatural({ width: image.naturalWidth, height: image.naturalHeight });
    }
  };

  // The skin's own bit of drag state: the primitive owns the gesture, this only says the pointer is down, for the cursor
  // and for the transition.
  const [dragging, setDragging] = createSignal(false);

  const viewport = merge(panzoom.viewportProps, {
    "data-part": "panzoom-viewport",
    get "data-dragging"() {
      return dragging() ? "true" : undefined;
    },
    get "data-gliding"() {
      return glide.gliding() ? "true" : undefined;
    },
    get style() {
      const { width, height } = size();
      // kebab-case: Solid's style helper sets every key with `setProperty`, which ignores a camelCase name
      return { "aspect-ratio": `${width} / ${height}` };
    },
    get class() {
      return viewportClass;
    },
    onPointerDown: (event: PointerEvent) => {
      // the grab takes the picture before the primitive snapshots the offset for the drag: no frame can land between
      glide.grab();
      setDragging(true);
      if (event.button !== 0) {
        panzoom.viewportProps.onPointerDown(event);
        return;
      }
      if (pointers.size === 0) {
        pinched = false;
        samples.length = 0;
      }
      pointers.add(event.pointerId);
      if (pointers.size > 1) {
        pinched = true;
      }
      sample(event);
      panzoom.viewportProps.onPointerDown(event);
    },
    onPointerMove: (event: PointerEvent) => {
      if (pointers.has(event.pointerId)) {
        sample(event);
      }
      panzoom.viewportProps.onPointerMove(event);
    },
    onPointerUp: (event: PointerEvent) => {
      setDragging(false);
      panzoom.viewportProps.onPointerUp(event);
      pointers.delete(event.pointerId);
      if (pointers.size > 0) {
        // a finger remains: the gesture continues, and a pinch never ends in a fling
        return;
      }
      const released = !pinched && samples.length > 0 ? velocity(event.timeStamp) : undefined;
      pinched = false;
      samples.length = 0;
      if (released !== undefined) {
        glide.fling(released.x, released.y);
      }
    },
    onPointerCancel: (event: PointerEvent) => {
      setDragging(false);
      panzoom.viewportProps.onPointerCancel(event);
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        pinched = false;
        samples.length = 0;
      }
    },
    onKeyDown: (event: KeyboardEvent) => {
      // the reader took over: a key ends the glide where it is, before the primitive moves the picture
      if (glide.gliding()) {
        glide.stop();
      }
      panzoom.viewportProps.onKeyDown(event);
    },
    onDblClick: (event: MouseEvent) => {
      // a reset is a take-over too: the glide must not carry the picture away from where reset put it
      if (glide.gliding()) {
        glide.stop();
      }
      panzoom.viewportProps.onDblClick(event);
    },
  } as PartProps);

  const image = merge(panzoom.imageProps, {
    "data-part": "panzoom-image",
    get "data-dragging"() {
      return dragging() ? "true" : undefined;
    },
    get class() {
      return imageClass;
    },
  } as PartProps);

  return (
    <div data-part="panzoom" class={css.cn(rootClass, props.class)}>
      <div {...viewport}>
        <img
          {...image}
          alt={props.alt}
          src={props.src}
          width={size().width}
          height={size().height}
          onLoad={readNatural}
        />
      </div>
      <div data-part="panzoom-bar" class={barClass}>
        <span {...panzoom.valueProps} data-part="panzoom-value" class={valueClass}>
          {panzoom.value()}
        </span>
        <div data-part="panzoom-controls" class={controlsClass}>
          <Button size="sm" tone="quiet" onClick={panzoom.zoomOut}>
            Zoom out
          </Button>
          <Button size="sm" tone="quiet" onClick={panzoom.zoomIn}>
            Zoom in
          </Button>
          <Button size="sm" tone="quiet" onClick={panzoom.reset}>
            Reset
          </Button>
        </div>
      </div>
      <p data-part="panzoom-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
