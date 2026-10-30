import { createMeter, type Meter as MeterController, type MeterOptions } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, untrack } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the meter, `data-part` and the caller's class merged in. */
export type MeterPartProps = PartProps;

export interface MeterProps extends Omit<MeterOptions, "label">, Renderable<MeterPartProps, void> {
  /** The meter's name: a `role="meter"` needs one. */
  readonly label: string;
  /** The primitive, once: a page that reads the figure as well as shows it. */
  readonly onReady?: (meter: MeterController) => void;
  readonly class?: string;
}

// A gauge: a track and the fill of the value in it. The primitive owns every attribute the widget announces; the fill's
// width is the one thing CSS cannot read off `aria-valuenow` (an arithmetic turn of it needs `attr()` in `calc()`), so it is
// an inline percentage from the same `percent()` the `aria-valuetext` is made of, and the two never disagree.
const meter = css.cn(
  css.boxSizing("border-box"),
  css.display("flex"),
  css.width("100%"),
  css.height(t.space._2),
  css.overflow("hidden"),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
);

const fill = css.cn(
  css.display("block"),
  css.height("100%"),
  css.borderRadius("999px"),
  css.bg(t.color.highlight),
  css.transition("width 160ms"),
);

/**
 * APG meter: a graphical display of a value within a range. The track is the `role="meter"` element, so `aria-valuenow` and
 * `aria-valuetext` sit on the box a reader lands on; the fill is decoration. The primitive has no `low`/`high`/`optimum`
 * thresholds, so there is no second state to paint: the fill is the value.
 */
export const Meter = (props: MeterProps): JSX.Element => {
  const meterControl = createMeter({
    get value() {
      return props.value;
    },
    get min() {
      return props.min;
    },
    get max() {
      return props.max;
    },
    get valueText() {
      return props.valueText;
    },
    get labelId() {
      return props.labelId;
    },
    label: props.label,
  });
  untrack(() => props.onReady)?.(meterControl);
  const own = {
    "data-part": "meter",
    get class() {
      return css.cn(meter, props.class);
    },
  } as PartProps;
  return renderPart(props, merge(meterControl.meterProps, own), undefined, (part) => (
    <div {...part}>
      <span
        aria-hidden="true"
        data-part="meter-fill"
        class={fill}
        style={{ width: `${meterControl.percent()}%` }}
      />
    </div>
  ));
};
