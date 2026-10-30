import {
  type Slider as SliderController,
  type SliderOptions,
  createSlider,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, untrack } from "solid-js";

import { type PartProps, type Render, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the rail's props, its class merged with the caller's, and `data-part`. */
export type SliderPartProps = PartProps;

export interface SliderProps extends Omit<SliderOptions, "id">, Renderable<SliderPartProps, void> {
  /** The slider's name: a `role="slider"` needs one. */
  readonly label: string;
  /** The primitive has no disabled state, so the kit announces one and stops listening. */
  readonly disabled?: boolean;
  /** The thumb: `render` is the rail, which is the box a page lays out. */
  readonly renderThumb?: Render<PartProps, void>;
  readonly class?: string;
  /** The primitive, once: a page that reads the figure as well as shows it. */
  readonly onReady?: (slider: SliderController) => void;
}

// The rail is the box, the fill and the thumb are decoration over it: the thumb is the announced `role=slider`, and the
// primitive owns its value, bounds, orientation and keys. The rail copies the announced orientation to `data-orientation`
// because a box cannot read an attribute of its child: the fill and the thumb paint the vertical geometry from it, and the
// thumb paints its own from `aria-orientation` — one source, the primitive's `orientation`, so the two cannot disagree.
const rail = css.cn(
  css.boxSizing("border-box"),
  css.position("relative"),
  css.display("block"),
  css.width("100%"),
  css.height(t.space._2),
  css.bg(t.color.buttonBackground),
  css.borderRadius("999px"),
  css.cursor("pointer"),
  css.transition("background-color 120ms"),
  css.attr("data-orientation", "vertical")(css.width(t.space._2), css.height(t.space._10)),
  css.attr("aria-disabled", "true")(css.bg(t.color.borderDisabled), css.cursor("not-allowed")),
);

const fill = css.cn(
  css.position("absolute"),
  css.insetBlock("0"),
  css.insetInlineStart("0"),
  css.borderRadius("999px"),
  css.bg(t.color.highlight),
  css.transition("width 120ms, height 120ms"),
  css.within(css.attr("data-orientation", "vertical"))(
    css.insetBlock("auto"),
    css.insetBlockEnd("0"),
    css.height("100%"),
    css.width("100%"),
  ),
  css.attr("aria-disabled", "true")(css.bg(t.color.textDisabled)),
);

const thumb = css.cn(
  css.boxSizing("border-box"),
  css.position("absolute"),
  css.insetBlockStart("50%"),
  css.width("1.25rem"),
  css.height("1.25rem"),
  css.border("1px solid", t.color.border),
  css.borderRadius("999px"),
  css.bg(t.color.surface),
  css.transform("translate(-50%, -50%)"),
  css.transition("background-color 120ms, border-color 120ms"),
  css.hover(css.border("1px solid", t.color.borderHover)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-disabled", "true")(
    css.bg(t.color.borderDisabled),
    css.border("1px solid", t.color.borderDisabled),
    css.cursor("not-allowed"),
  ),
  css.attr("aria-orientation", "vertical")(
    css.insetBlockStart("auto"),
    css.transform("translate(-50%, 50%)"),
  ),
);

/**
 * APG slider, styled: a rail, the fill of the value and the thumb. `createSlider` owns the value, the bounds, the
 * orientation, the arrow/Home/End keys and the rail press; the one thing CSS cannot read off `aria-valuenow` is the fill's
 * share of the rail (an arithmetic turn of `attr()` inside `calc()`), so the width is an inline percentage of the same
 * attributes the thumb announces, as `Meter` does. Vertical, the rail is as tall as `space.10` and a page sets its own.
 *
 * `value` makes it controlled; without it the slider owns the value. `onValueChange` is a request the host may ignore.
 */
export const Slider = (props: SliderProps): JSX.Element => {
  const slider = createSlider({
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get step() {
      return props.step;
    },
    get largeStep() {
      return props.largeStep;
    },
    get value() {
      return props.value;
    },
    defaultValue: props.defaultValue,
    get orientation() {
      return props.orientation;
    },
    get direction() {
      return props.direction;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(slider);

  const disabled = (): boolean => props.disabled === true;
  const orientation = (): "horizontal" | "vertical" => props.orientation ?? "horizontal";
  // the same two attributes the thumb announces, so the fill cannot disagree with the value a reader hears
  const percent = (): number => {
    const min = Number(slider.thumbProps["aria-valuemin"]);
    const max = Number(slider.thumbProps["aria-valuemax"]);
    const now = Number(slider.thumbProps["aria-valuenow"]);
    return max > min ? ((now - min) / (max - min)) * 100 : 0;
  };

  const railPart = merge(slider.trackProps, {
    "data-part": "slider",
    get "data-orientation"() {
      return slider.thumbProps["aria-orientation"];
    },
    get "aria-disabled"() {
      return disabled() ? "true" : undefined;
    },
    get class() {
      return css.cn(rail, props.class);
    },
    onPointerDown: (event: PointerEvent) => {
      if (!disabled()) {
        slider.trackProps.onPointerDown(event);
      }
    },
  });

  const thumbPart = merge(slider.thumbProps, {
    "data-part": "slider-thumb",
    "aria-label": props.label,
    get "aria-disabled"() {
      return disabled() ? "true" : undefined;
    },
    class: thumb,
    get style() {
      return orientation() === "vertical"
        ? { "inset-inline-start": "50%", "inset-block-end": `${percent()}%` }
        : { "inset-inline-start": `${percent()}%` };
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (!disabled()) {
        slider.thumbProps.onKeyDown(event);
      }
    },
  });

  return renderPart(props, railPart, undefined, (part) => (
    <div {...part}>
      <span
        aria-hidden="true"
        data-part="slider-fill"
        class={fill}
        style={
          orientation() === "vertical" ? { height: `${percent()}%` } : { width: `${percent()}%` }
        }
      />
      {renderPart({ render: props.renderThumb }, thumbPart, undefined, (control) => (
        <div {...control} />
      ))}
    </div>
  ));
};
