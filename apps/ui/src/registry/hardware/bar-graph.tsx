import { createMeter, type Meter as MeterController, type MeterOptions } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import { For, merge, untrack } from "solid-js";

export interface BarGraphProps extends Omit<MeterOptions, "label"> {
  /** The graph's name: a `role="meter"` needs one. */
  readonly label: string;
  /** How many segments stand between the two ends. @default 12 */
  readonly segments?: number | undefined;
  /** The primitive, once: a page that reads the figure as well as shows it. */
  readonly onReady?: ((meter: MeterController) => void) | undefined;
}

const DEFAULT_SEGMENTS = 12;

/**
 * A bar graph: a row of segments, each lit or dark, filled up to the value. `createMeter` owns the figure, the bounds and the
 * announced `aria-valuenow` / `aria-valuetext`; the sheet owns the pitch, the ghost of an unlit segment and the glow of a
 * lit one.
 *
 * A segment's share is one number, `--v` (0 dark, 1 lit), which the sheet reads for the height of its lit column: how many
 * segments are lit is arithmetic over `aria-valuenow`, which CSS cannot do, so it is computed here from the primitive's own
 * percentage and written once on each segment. Nothing else about a segment is state.
 */
export const BarGraph = (props: BarGraphProps): JSX.Element => {
  const meter = createMeter({
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
  untrack(() => props.onReady)?.(meter);

  const count = (): number => Math.max(1, props.segments ?? DEFAULT_SEGMENTS);
  const at = (index: number): number =>
    index < Math.round((meter.percent() / 100) * count()) ? 1 : 0;

  return (
    <div {...merge(meter.meterProps, { "data-part": "bar-graph" })}>
      <For each={Array.from({ length: count() }, (_, index) => index)}>
        {(index) => (
          <span
            data-part="bar-graph-segment"
            aria-hidden="true"
            style={{ "--v": String(at(index)) }}
          />
        )}
      </For>
    </div>
  );
};
