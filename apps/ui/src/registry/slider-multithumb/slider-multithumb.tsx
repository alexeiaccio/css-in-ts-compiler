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
// primitive owns its value, bounds, orientation and keys. The rail copies the announced orientation to `data-orientation`
// because a box cannot read an attribute of its child: the fill and the thumbs paint the vertical geometry from it.
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
  css.attr("aria-orientation", "vertical")(
    css.insetBlockStart("auto"),
    css.transform("translate(-50%, 50%)"),
  ),
);

/**
 * APG multi-thumb slider, styled: a rail, the interval between the two thumbs as a fill, and the two thumbs.
 * `createSliderMultiThumb` owns the pair, the neighbour bounds (a thumb cannot pass the other), the orientation, the
 * arrow/Home/End/Page keys and a press on one thumb; the kit adds the interval and the rail press.
 *
 * The primitive announces each thumb's `aria-valuenow` / `aria-valuemin` / `aria-valuemax`, and the outer two are the
 * range: the lower thumb's `aria-valuemin` is the range's minimum and the higher thumb's `aria-valuemax` is its maximum,
 * while the inner bounds follow the neighbour. So both thumbs and the fill are percentages of the same announced numbers
 * (`(now - min) / (max - min)`), and a thumb's position and the fill's edges cannot disagree with the value a reader hears.
 * The fill spans `lo` to `hi`; nothing is measured for it.
 *
 * The primitive has no rail press (a press names its thumb), so the kit picks the nearer thumb from the press point, which
 * is the only measurement here: a pointer has a position, and the primitive wants a 0..1 fraction of the rail.
 *
 * `value` makes it controlled; without it the slider owns the pair. `onValueChange` is a request the host may ignore.
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

  const press = (event: PointerEvent): void => {
    const element = event.currentTarget as HTMLElement;
    // a press on a thumb is the primitive's own: it already names the thumb
    if (
      !(event.target instanceof Element) ||
      event.target.closest("[data-part='thumb']") !== null
    ) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const raw =
      orientation() === "vertical"
        ? 1 - (event.clientY - rect.top) / rect.height
        : (event.clientX - rect.left) / rect.width;
    const position = Math.min(1, Math.max(0, raw));
    const point = position * 100;
    const index: SliderMultiThumbIndex =
      Math.abs(point - percentOf(0)) <= Math.abs(point - percentOf(1)) ? 0 : 1;
    slider.pointerDown(index, position);
    element.querySelectorAll<HTMLElement>("[data-part='thumb']")[index]?.focus();
  };

  const railPart = {
    "data-part": "track",
    get "data-orientation"() {
      return orientation();
    },
    get class() {
      return css.cn(rail, props.class);
    },
    onPointerDown: press,
  } as PartProps;

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
