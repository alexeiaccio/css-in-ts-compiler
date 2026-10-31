import {
  type SliderMultiThumb as SliderMultiThumbController,
  type SliderMultiThumbIndex,
  type SliderMultiThumbOptions,
  createSliderMultiThumb,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, untrack } from "solid-js";

import { type PartProps, type Render, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the rail's props, its class merged with the caller's, and `data-part`. */
export type SliderMultithumbPartProps = PartProps;

export interface SliderMultithumbProps
  extends Omit<SliderMultiThumbOptions, "id">, Renderable<SliderMultithumbPartProps, void> {
  /** The slider's name: each `role="slider"` thumb derives its own from it. */
  readonly label: string;
  /** A thumb: `render` is the rail, which is the box a page lays out. */
  readonly renderThumb?: Render<PartProps, void>;
  readonly class?: string;
  /** The primitive, once: a page that reads the pair as well as shows it. */
  readonly onReady?: (slider: SliderMultiThumbController) => void;
}

// The rail is the box, the fill and the two thumbs are decoration over it: each thumb is the announced `role=slider`, and the
// primitive owns its value, bounds, orientation, keys, the nearest-thumb press and the drag. The rail copies the announced
// orientation to `data-orientation` because a box cannot read an attribute of its child: the fill and the thumbs paint the
// vertical geometry from it. `touch-action` and `user-select` are the one thing the drag needs from CSS (the primitive
// carries none): a press on a touch rail must move the thumb instead of scrolling the page, and a mouse drag must not select
// the text it crosses.
const rail = css.cn(
  css.boxSizing("border-box"),
  css.position("relative"),
  css.display("block"),
  css.width("100%"),
  css.height(t.space._2),
  css.bg(t.color.buttonBackground),
  css.borderRadius("999px"),
  css.cursor("pointer"),
  css.touchAction("none"),
  css.userSelect("none"),
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
  css.transition("inset-inline-start 120ms, width 120ms, height 120ms"),
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
 * APG multi-thumb slider, styled: a rail, the interval between the two thumbs as a fill, and the two thumbs.
 * `createSliderMultiThumb` owns the pair, the neighbour bounds (a thumb cannot pass the other), the orientation, the
 * arrow/Home/End/Page keys, the nearest-thumb rail press and the drag; the kit adds the interval and the DOM focus.
 *
 * The primitive announces each thumb's `aria-valuenow` / `aria-valuemin` / `aria-valuemax`, and the outer two are the
 * range: the lower thumb's `aria-valuemin` is the range's minimum and the higher thumb's `aria-valuemax` is its maximum,
 * while the inner bounds follow the neighbour. So both thumbs and the fill are percentages of the same announced numbers
 * (`(now - min) / (max - min)`), and a thumb's position and the fill's edges cannot disagree with the value a reader hears.
 * The fill spans `lo` to `hi`; nothing is measured for it, and nothing is measured for the press either: the primitive
 * reads the pointer's position on the rail and names the thumb.
 *
 * A press names the thumb the primitive announces in `focused()`; the host moves the DOM focus with it, because an
 * element is the host's and the primitive owns only state.
 *
 * `value` makes it controlled; without it the slider owns the pair. `onValueChange` is a request the host may ignore.
 * `disabled` is the primitive's: both thumbs announce `aria-disabled` and drop every key, rail press and drag, so the kit
 * only copies that announced state onto the rail, the fill and the thumbs (a box cannot read an attribute of its child).
 */
export const SliderMultithumb = (props: SliderMultithumbProps): JSX.Element => {
  const slider = createSliderMultiThumb({
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
    get disabled() {
      return props.disabled;
    },
    get onValueChange() {
      return props.onValueChange;
    },
  });
  untrack(() => props.onReady)?.(slider);

  // the same attributes the thumbs announce, so the fill and the thumbs cannot disagree with the pair a reader hears
  const rangeMin = (): number => Number(slider.thumbProps(0)["aria-valuemin"]);
  const rangeMax = (): number => Number(slider.thumbProps(1)["aria-valuemax"]);
  const percentOf = (index: SliderMultiThumbIndex): number => {
    const min = rangeMin();
    const max = rangeMax();
    const now = Number(slider.thumbProps(index)["aria-valuenow"]);
    return max > min ? ((now - min) / (max - min)) * 100 : 0;
  };
  const orientation = (): "horizontal" | "vertical" => slider.thumbProps(0)["aria-orientation"];

  // The primitive names the thumb a press moves and a drag keeps; the host moves the DOM focus with it (the primitive
  // announces `focused()`, it cannot focus an element it does not own). A disabled pair keeps its focus where it is.
  const press = (event: PointerEvent): void => {
    slider.trackProps.onPointerDown(event);
    if (slider.thumbProps(0)["aria-disabled"] === "true") {
      return;
    }
    const index = slider.focused();
    if (index === null || !(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    event.currentTarget.querySelectorAll<HTMLElement>("[data-part='thumb']")[index]?.focus();
  };

  const railPart = merge(slider.trackProps, {
    "data-part": "track",
    get "data-orientation"() {
      return orientation();
    },
    get "aria-disabled"() {
      return slider.thumbProps(0)["aria-disabled"];
    },
    get class() {
      return css.cn(rail, props.class);
    },
    onPointerDown: press,
  });

  const thumbPart = (index: SliderMultiThumbIndex) =>
    merge(slider.thumbProps(index), {
      "data-part": "thumb",
      "aria-label": `${props.label} ${index === 0 ? "lower" : "upper"} thumb`,
      class: thumb,
      get style() {
        const start = `${percentOf(index)}%`;
        return orientation() === "vertical"
          ? { "inset-inline-start": "50%", "inset-block-end": start }
          : { "inset-inline-start": start };
      },
    });

  return renderPart(props, railPart, undefined, (part) => (
    <div {...part}>
      <span
        aria-hidden="true"
        data-part="fill"
        class={fill}
        style={
          orientation() === "vertical"
            ? {
                "inset-block-end": `${percentOf(0)}%`,
                height: `${percentOf(1) - percentOf(0)}%`,
              }
            : {
                "inset-inline-start": `${percentOf(0)}%`,
                width: `${percentOf(1) - percentOf(0)}%`,
              }
        }
      />
      {renderPart({ render: props.renderThumb }, thumbPart(0), undefined, (control) => (
        <div {...control} />
      ))}
      {renderPart({ render: props.renderThumb }, thumbPart(1), undefined, (control) => (
        <div {...control} />
      ))}
    </div>
  ));
};
