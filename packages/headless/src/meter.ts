import { type Accessor } from "solid-js";

/**
 * A controlled numeric display; the consumer feeds `value`/`min`/`max`.
 * `valueText` overrides the default percentage `aria-valuetext`.
 */
export interface MeterOptions {
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
  readonly valueText?: string | undefined;
  readonly label?: string | undefined;
  readonly labelId?: string | undefined;
}

/** Spread onto the element with `role=meter`. */
export interface MeterProps {
  readonly role: "meter";
  readonly "aria-valuemin": number;
  readonly "aria-valuemax": number;
  readonly "aria-valuenow": number;
  readonly "aria-valuetext": string;
  readonly "aria-label": string | undefined;
  readonly "aria-labelledby": string | undefined;
}

export interface Meter {
  readonly min: Accessor<number>;
  readonly max: Accessor<number>;
  /** The raw value clamped into `[min, max]`. */
  readonly value: Accessor<number>;
  readonly percent: Accessor<number>;
  /** Getter-backed, so spreading it keeps every attribute reactive. */
  readonly meterProps: MeterProps;
}

const clamp = (value: number, lo: number, hi: number): number =>
  value < lo ? lo : value > hi ? hi : value;

/**
 * APG Meter (https://www.w3.org/WAI/ARIA/apg/patterns/meter/): a graphical
 * display of a numeric value within a range. Platform: native (`<meter>`), so
 * this primitive only derives the ARIA contract; no state machine runs here.
 */
export const createMeter = (options: MeterOptions = {}): Meter => {
  const min = (): number => options.min ?? 0;
  const max = (): number => options.max ?? 100;
  const span = (): number => max() - min();
  const value = (): number => {
    const lo = min();
    const hi = max();
    return hi <= lo ? lo : clamp(options.value ?? 0, lo, hi);
  };
  const percent = (): number => {
    const width = span();
    return width <= 0 ? 0 : Math.round(((value() - min()) / width) * 100);
  };

  return {
    min,
    max,
    value,
    percent,
    meterProps: {
      role: "meter",
      get "aria-valuemin"() {
        return min();
      },
      get "aria-valuemax"() {
        return max();
      },
      get "aria-valuenow"() {
        return value();
      },
      get "aria-valuetext"() {
        return options.valueText ?? `${percent()}%`;
      },
      get "aria-label"() {
        return options.label;
      },
      get "aria-labelledby"() {
        return options.labelId;
      },
    },
  };
};
