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
  readonly class?: string;
  /** The primitive, once: a page that reads `scale()` or drives the camera. */
  readonly onReady?: (panzoom: PanZoomController) => void;
}

const DEFAULT_HINT = "Drag to pan, pinch or Ctrl/⌘ + wheel to zoom. Keys: +, -, arrows and 0.";

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
 * rounded corners, the focus ring, the value and the three buttons, the hint, and the transition that honours reduced
 * motion.
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
    "data-dragging": () => (dragging() ? "true" : undefined),
    get style() {
      const { width, height } = size();
      // kebab-case: Solid's style helper sets every key with `setProperty`, which ignores a camelCase name
      return { "aspect-ratio": `${width} / ${height}` };
    },
    get class() {
      return viewportClass;
    },
    onPointerDown: (event: PointerEvent) => {
      setDragging(true);
      panzoom.viewportProps.onPointerDown(event);
    },
    onPointerUp: (event: PointerEvent) => {
      setDragging(false);
      panzoom.viewportProps.onPointerUp(event);
    },
    onPointerCancel: (event: PointerEvent) => {
      setDragging(false);
      panzoom.viewportProps.onPointerCancel(event);
    },
  } as PartProps);

  const image = merge(panzoom.imageProps, {
    "data-part": "panzoom-image",
    "data-dragging": () => (dragging() ? "true" : undefined),
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
