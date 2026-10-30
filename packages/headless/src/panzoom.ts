import { type Accessor, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/** A point in the viewport's own coordinate space: `0, 0` is its top-left corner. */
export interface PanZoomPoint {
  readonly x: number;
  readonly y: number;
}

export interface PanZoomOptions {
  /** Smallest scale, and where `reset` returns to. Default 1. */
  readonly min?: number | undefined;
  /** Largest scale. Default 4. */
  readonly max?: number | undefined;
  /** The `+` / `-` / `zoomIn` / `zoomOut` increment. Default 0.25. */
  readonly step?: number | undefined;
  /** Starting scale when uncontrolled; ignored while `scale` is set. */
  readonly defaultScale?: number | undefined;
  /** Controlled: the host owns the scale and this is the only thing that changes it. */
  readonly scale?: number | undefined;
  /**
   * A request to change the scale, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onScaleChange?: (scale: number) => void;
  /** The pan changed (a drag, a pinch, an arrow key, a zoom about a point, a reset). */
  readonly onPanChange?: (offset: PanZoomPoint) => void;
  /**
   * `"clamp"` (default) keeps the scaled image covering the viewport: the offset
   * never opens a gap. `"free"` lets it be dragged out of view.
   */
  readonly bounds?: "clamp" | "free" | undefined;
  readonly labels?: { readonly viewport?: string } | undefined;
}

export interface PanZoomViewportProps {
  readonly tabindex: number;
  readonly role: "group";
  readonly "aria-roledescription": string;
  readonly "aria-label": string;
  readonly "aria-describedby": string;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onWheel: (event: WheelEvent) => void;
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
  readonly onDblClick: (event: MouseEvent) => void;
}

/**
 * Spread onto the image. `style` is a getter returning a fresh object, so Solid
 * reads it inside the tracking scope; `draggable: false` keeps the native image
 * drag from swallowing the pan gesture.
 */
export interface PanZoomImageProps {
  readonly draggable: false;
  readonly style: { readonly transform: string };
}

/** The live value: the current percentage, in a polite status region (`aria-describedby` of the viewport). */
export interface PanZoomValueProps {
  readonly id: string;
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface PanZoom {
  readonly scale: Accessor<number>;
  readonly offset: Accessor<PanZoomPoint>;
  /** Back to `min` and centred. */
  readonly reset: () => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  /** A request; `origin` is the viewport point to keep still (its centre by default). */
  readonly setScale: (scale: number, origin?: PanZoomPoint) => void;
  readonly viewportProps: PanZoomViewportProps;
  readonly imageProps: PanZoomImageProps;
  readonly valueProps: PanZoomValueProps;
  /** The human value of `valueProps`: `"150%"`. */
  readonly value: Accessor<string>;
}

/** Arrow-key pan distance, in CSS px; Shift multiplies it. */
const PAN_STEP = 24;
const PAN_SHIFT = 4;
/** A ctrl/meta wheel notch. */
const WHEEL_FACTOR = 1.1;

const axis = (value: number, limit: number): number => Math.min(limit, Math.max(-limit, value));

/**
 * Pan and zoom for one image in a viewport: scale, offset and the prop objects
 * for a focusable viewport, the transformed image and a live value.
 *
 * **There is no APG pattern for pan-zoom.** The accessible contract is the three
 * parts this returns: a viewport that takes focus (`role=group`, `tabindex=0`,
 * `aria-roledescription="zoomable image"`), keyboard operations that stand in
 * for every pointer gesture (`+` / `=` / `-` zoom, arrows pan, `0` resets), and a
 * polite live region (`aria-describedby` of the viewport) that carries the
 * current scale. The pointer gestures are an addition for mouse and touch, never
 * the only way in. That contract is this module's own: the case it replaces
 * (kocharin-art-3's `Zoomable`, ~110 lines of pointer maths) had no keyboard path
 * and no ARIA at all, and `createCanvas` is the wrong model here — an infinite
 * canvas moves a camera over a world, while this is one image fitted to its
 * viewport.
 *
 * Wheel is zoom-with-a-modifier only: `ctrl` / `meta` (the browser's own pinch
 * arrives as `ctrl+wheel`) zooms about the cursor; a bare wheel is never
 * `preventDefault`ed, so the page keeps scrolling. Trackpad gestures differ per
 * platform and a swallowed wheel is the one thing that is never acceptable.
 *
 * Pointer: a drag pans, a second pointer pinches (about its midpoint), a double
 * click resets. Capture is best-effort (a synthetic pointer cannot be captured).
 *
 * `bounds: "clamp"` bounds the offset by half the viewport's scaled overflow, so
 * the image is expected to fill the viewport at `min` (the usual
 * `width: 100%; height: 100%` / `object-fit: cover` box). A letterboxed image
 * smaller than its viewport cannot be held gap-free; give it a viewport of its
 * own or `bounds: "free"`.
 *
 * Request/commit (`rt1p`): uncontrolled by default (`defaultScale`); pass `scale`
 * + `onScaleChange` to own the value. The offset has no controlled prop, so a
 * hosting page that rejects a scale request also gets the offset resolved for the
 * scale it refused — accept the request, or pass `bounds: "free"` and own the
 * pan elsewhere.
 *
 * The host owns the box and the looks: size the viewport, put `touch-action:
 * none` on it if a touch drag should pan, centre the image
 * (`transform-origin: 50% 50%` is the default this maths assumes), and hide the
 * live region visually rather than with `hidden` (a `hidden` live region is not
 * announced).
 */
export const createPanZoom = (options: PanZoomOptions = {}): PanZoom => {
  const min = options.min ?? 1;
  const max = options.max ?? 4;
  const step = options.step ?? 0.25;
  const bounds = (): "clamp" | "free" => options.bounds ?? "clamp";
  const valueId = createUniqueId();

  const clamp = (next: number): number => Math.min(max, Math.max(min, next));

  const [scale, requestScale] = createControllable({
    value: () => options.scale,
    initial: clamp(options.defaultScale ?? min),
    onChange: () => options.onScaleChange,
  });

  // Solid 2 applies setters on the next flush, so a signal can lag behind a
  // request made in the same tick (the same reason `controllable.ts` keeps a
  // `local`). `last` is always fresh for the maths; `version` only notifies.
  const [version, setVersion] = createSignal(0);
  let last: PanZoomPoint = { x: 0, y: 0 };
  const offset = (): PanZoomPoint => {
    version();
    return last;
  };
  const setOffset = (next: PanZoomPoint): void => {
    last = next;
    setVersion((count) => count + 1);
  };
  // the viewport as last measured by an event; a method call (`reset`, `setScale`)
  // has no element of its own, and the clamp needs the size
  let box = { left: 0, top: 0, width: 0, height: 0 };

  const measure = (event: { readonly currentTarget: EventTarget | null }): void => {
    if (!(event.currentTarget instanceof Element)) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    box = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  };

  // the offset that still leaves the scaled image covering the viewport
  const limits = (at: number): PanZoomPoint => ({
    x: Math.max(0, (box.width * (at - 1)) / 2),
    y: Math.max(0, (box.height * (at - 1)) / 2),
  });

  const move = (next: PanZoomPoint, at: number = scale()): void => {
    const allowed = limits(at);
    const target =
      bounds() === "free" ? next : { x: axis(next.x, allowed.x), y: axis(next.y, allowed.y) };
    const previous = offset();
    if (target.x === previous.x && target.y === previous.y) {
      return;
    }
    setOffset(target);
    options.onPanChange?.(target);
  };

  const setScale = (next: number, origin?: PanZoomPoint): void => {
    const before = scale();
    const target = clamp(next);
    if (target === before) {
      return;
    }
    requestScale(target);
    // keep the viewport point under `origin` still: offset' = o - (o - offset) * ratio, o centred
    const at = origin ?? { x: box.width / 2, y: box.height / 2 };
    const o = { x: at.x - box.width / 2, y: at.y - box.height / 2 };
    const ratio = before > 0 ? target / before : 1;
    const current = offset();
    move(
      {
        x: o.x - (o.x - current.x) * ratio,
        y: o.y - (o.y - current.y) * ratio,
      },
      target,
    );
  };

  const zoomIn = (): void => setScale(scale() + step);
  const zoomOut = (): void => setScale(scale() - step);

  const reset = (): void => {
    requestScale(min);
    move({ x: 0, y: 0 }, min);
  };

  // ---- pointer: drag to pan, two pointers to pinch ----

  const pointers = new Map<number, PanZoomPoint>();
  let drag: { readonly at: PanZoomPoint; readonly from: PanZoomPoint } | undefined;
  let pinch: { readonly distance: number; readonly scale: number } | undefined;

  const distance = (): number => {
    const [a, b] = [...pointers.values()];
    return a === undefined || b === undefined ? 0 : Math.hypot(a.x - b.x, a.y - b.y);
  };

  const midpoint = (): PanZoomPoint => {
    const [a, b] = [...pointers.values()];
    if (a === undefined || b === undefined) {
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const local = (point: PanZoomPoint): PanZoomPoint => ({
    x: point.x - box.left,
    y: point.y - box.top,
  });

  const pointerDown = (event: PointerEvent): void => {
    measure(event);
    if (event.button !== 0) {
      return;
    }
    try {
      if (event.currentTarget instanceof Element) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } catch {
      // a synthetic pointer (tests, assistive technology) is not an active pointer: nothing to capture
    }
    const at = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, at);
    drag = { at, from: offset() };
    if (pointers.size === 2) {
      pinch = { distance: distance(), scale: scale() };
    }
  };

  const pointerMove = (event: PointerEvent): void => {
    if (!pointers.has(event.pointerId)) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch !== undefined) {
      if (pinch.distance > 0) {
        setScale(pinch.scale * (distance() / pinch.distance), local(midpoint()));
      }
      return;
    }
    if (drag !== undefined) {
      move({
        x: drag.from.x + event.clientX - drag.at.x,
        y: drag.from.y + event.clientY - drag.at.y,
      });
    }
  };

  const pointerUp = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    pinch = undefined;
    const rest = [...pointers.values()][0];
    // a lift after a two-finger gesture continues from where the last finger is,
    // so the image does not jump by the distance between them
    drag = rest === undefined ? undefined : { at: rest, from: offset() };
  };

  // ---- wheel and keys ----

  const wheel = (event: WheelEvent): void => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    measure(event);
    const factor = event.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR;
    setScale(scale() * factor, { x: event.clientX - box.left, y: event.clientY - box.top });
  };

  const keyDown = (event: KeyboardEvent): void => {
    measure(event);
    const by = PAN_STEP * (event.shiftKey ? PAN_SHIFT : 1);
    const current = offset();
    switch (event.key) {
      case "+":
      case "=":
        zoomIn();
        break;
      case "-":
      case "_":
        zoomOut();
        break;
      case "0":
        reset();
        break;
      case "ArrowLeft":
        move({ x: current.x - by, y: current.y });
        break;
      case "ArrowRight":
        move({ x: current.x + by, y: current.y });
        break;
      case "ArrowUp":
        move({ x: current.x, y: current.y - by });
        break;
      case "ArrowDown":
        move({ x: current.x, y: current.y + by });
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return {
    scale,
    offset,
    reset,
    zoomIn,
    zoomOut,
    setScale,
    value: () => `${Math.round(scale() * 100)}%`,
    viewportProps: {
      tabindex: 0,
      role: "group",
      "aria-roledescription": "zoomable image",
      get "aria-label"() {
        return options.labels?.viewport ?? "Image";
      },
      get "aria-describedby"() {
        return valueId;
      },
      onKeyDown: keyDown,
      onWheel: wheel,
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: pointerUp,
      onPointerCancel: pointerUp,
      onDblClick: (event) => {
        measure(event);
        reset();
      },
    },
    imageProps: {
      draggable: false,
      get style() {
        const at = offset();
        return { transform: `translate(${at.x}px, ${at.y}px) scale(${scale()})` };
      },
    },
    valueProps: {
      id: valueId,
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  };
};
