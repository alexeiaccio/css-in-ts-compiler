import { type Knob as KnobController, type KnobOptions, createKnob } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createSignal, merge, untrack } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export interface KnobProps extends Omit<KnobOptions, "id" | "labels"> {
  /** The knob's visible name, which is also its accessible name. */
  readonly label: string;
  /** The dial's diameter in CSS. @default "6rem" */
  readonly size?: string | undefined;
  /** The primitive, once: a page that reads the value as well as shows it. */
  readonly onReady?: (knob: KnobController) => void;
  readonly class?: string | undefined;
}

const DEFAULT_SIZE = "6rem";
/** The arc sweeps three quarters of a turn, from the bottom-left to the bottom-right of the dial. */
const SWEEP = 0.75;
const START_DEGREES = -135;

const rootClass = css.cn(
  css.display("grid"),
  css.justifyItems("center"),
  css.gap(t.space._1),
  css.color(t.color.text),
  css.fontSize(t.font.size),
);

const labelClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.color(t.color.muted),
);

// The dial is the control: the primitive's role, tab stop and aria-* sit on this box, and the ring is drawn outside its
// rounded edge. `touch-action` and `user-select` are the one thing the spin and the slides need from CSS (the primitive
// carries none): a press on a touch dial must turn it instead of scrolling the page, and a mouse drag must not select text.
const dialClass = css.cn(
  css.position("relative"),
  css.display("grid"),
  css.placeItems("center"),
  css.boxSizing("border-box"),
  css.borderRadius("999px"),
  css.cursor("grab"),
  css.touchAction("none"),
  css.userSelect("none"),
  css.outline("none"),
  css.group("knob-dial"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.hover(css.bg(t.color.buttonBackground)),
  css.attr("data-dragging", "true")(
    css.cursor("grabbing"),
    css.bg(t.color.buttonBackgroundPressed),
  ),
);

const svgClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.display("block"),
  css.width("100%"),
  css.height("100%"),
  css.overflow("visible"),
  css.pointerEvents("none"),
);

const arcClass = css.cn(css.fill("none"), css.strokeWidth("8"), css.strokeLinecap("round"));

// The track is the dial's whole sweep, the value arc grows from its start; both are drawn with `pathLength=100`, so the two
// numbers of the dash are a percentage of the sweep and the skin needs no circumference. The arc follows a key or a wheel
// for a reader who allows motion, and snaps while the pointer drags it, so the paint never lags the hand.
const trackClass = css.cn(arcClass, css.stroke(t.color.border));

const valueClass = css.cn(
  arcClass,
  css.stroke(t.color.highlight),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("stroke-dasharray 140ms ease-out"),
  ),
  css.within(css.attr("data-dragging", "true"), "knob-dial")(css.transition("none")),
);

const pointerClass = css.cn(
  css.stroke(t.color.text),
  css.strokeWidth("3"),
  css.strokeLinecap("round"),
  css.media("(prefers-reduced-motion: no-preference)")(css.transition("transform 140ms ease-out")),
  css.within(css.attr("data-dragging", "true"), "knob-dial")(css.transition("none")),
);

// The readout is decoration: the primitive's `aria-valuetext` already says the value, and the live region repeats it. It is
// sized from the dial, so one `size` prop moves the figure with the circle; the tabular figures keep it from shifting.
const readoutClass = css.cn(
  css.pointerEvents("none"),
  css.fontWeight("600"),
  css.fontVariantNumeric("tabular-nums"),
  css.lineHeight(1),
  css.color(t.color.text),
);

// The live value: in the page and visually hidden, never `hidden` (a hidden live region is not announced).
const liveClass = css.cn(
  css.position("absolute"),
  css.width("1px"),
  css.height("1px"),
  css.overflow("hidden"),
  css.clipPath("inset(50%)"),
  css.whiteSpace("nowrap"),
);

/**
 * A knob, styled: `createKnob` owns the value, the bounds and the step, the spin and the two slides, the wheel, the arrows,
 * PageUp/PageDown, Home/End, and every `aria-*` the dial announces. The skin owns the look: the dial and its size, the
 * three-quarter arc with its track tone and its value tone, the pointer at the value, the visible readout taken from the
 * primitive's own `aria-valuetext` (so `format` is the one place the text is made), the label above, the focus ring, and the
 * reduced-motion rule.
 *
 * Nothing about the value lives here: the arc, the pointer and the readout all read `percentOf` and the announced value, so a
 * key, a drag and a host's controlled write paint the same picture. `value` makes it controlled; without it the knob owns the
 * value, and `onValueChange` is a request the host may ignore. There is no `disabled` in the primitive, so there is no
 * disabled look either.
 */
export const Knob = (props: KnobProps): JSX.Element => {
  const knob = createKnob({
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get step() {
      return props.step;
    },
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get wrap() {
      return props.wrap;
    },
    get gesture() {
      return props.gesture;
    },
    get format() {
      return props.format;
    },
    labels: { knob: props.label },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(knob);

  // The primitive does not announce a drag: the skin tracks it only to drop the arc's transition while the hand is on it.
  const [dragging, setDragging] = createSignal(false);

  const down = (event: PointerEvent): void => {
    knob.knobProps.onPointerDown(event);
    setDragging(true);
  };
  const up = (event: PointerEvent): void => {
    knob.knobProps.onPointerUp(event);
    setDragging(false);
  };
  const cancel = (event: PointerEvent): void => {
    knob.knobProps.onPointerCancel(event);
    setDragging(false);
  };

  const size = (): string => props.size ?? DEFAULT_SIZE;
  const turn = (): number => knob.percentOf(knob.value());
  const angle = (): number => Number((START_DEGREES + 360 * SWEEP * turn()).toFixed(3));

  const dial = merge(knob.knobProps, {
    "data-part": "knob-dial",
    get "data-dragging"() {
      return dragging() ? "true" : "false";
    },
    get class() {
      return css.cn(dialClass, props.class);
    },
    onPointerDown: down,
    onPointerUp: up,
    onPointerCancel: cancel,
    onLostPointerCapture: () => setDragging(false),
  });

  return (
    <div data-part="knob" class={rootClass}>
      <span class={labelClass}>{props.label}</span>
      <div {...dial} style={{ width: size(), height: size(), "font-size": `calc(${size()} / 5)` }}>
        <svg aria-hidden="true" class={svgClass} viewBox="0 0 100 100">
          <circle
            data-part="knob-track"
            class={trackClass}
            cx="50"
            cy="50"
            r="43"
            pathLength="100"
            transform="rotate(135 50 50)"
            stroke-dasharray={`${100 * SWEEP} 100`}
          />
          <circle
            data-part="knob-arc"
            class={valueClass}
            cx="50"
            cy="50"
            r="43"
            pathLength="100"
            transform="rotate(135 50 50)"
            stroke-dasharray={`${100 * SWEEP * turn()} 100`}
          />
          <line
            data-part="knob-pointer"
            class={pointerClass}
            x1="50"
            y1="15"
            x2="50"
            y2="22"
            transform={`rotate(${angle()} 50 50)`}
          />
        </svg>
        <span data-part="knob-readout" aria-hidden="true" class={readoutClass}>
          {knob.knobProps["aria-valuetext"]}
        </span>
      </div>
      <span {...knob.valueProps} data-part="knob-value" class={liveClass}>
        {knob.value()}
      </span>
    </div>
  );
};
