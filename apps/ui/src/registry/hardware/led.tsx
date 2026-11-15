import type { JSX } from "@solidjs/web";

export interface LedProps {
  /** The lamp's accessible name (`aria-label`), which is what a reader hears in place of the printed legend. */
  readonly label: string;
  /** Whether the lamp is lit. @default false */
  readonly on?: boolean | undefined;
  /** The printed legend beside the lamp; `label` when left out. */
  readonly legend?: string | undefined;
}

/**
 * A lamp: a small round lens in the panel, lit in the key colour at 0.86 lightness at most, so it still stands out from an
 * unlit one on the light panel. `role="img"` with a name, because a lamp is a picture of a state, not a control; the state
 * itself is `data-state`, which is both what the sheet paints and what a test reads.
 */
export const Led = (props: LedProps): JSX.Element => (
  <span
    data-part="led"
    role="img"
    aria-label={props.label}
    data-state={props.on === true ? "on" : "off"}
  >
    <span data-part="led-lamp" aria-hidden="true" />
    <span data-part="led-legend" aria-hidden="true">
      {props.legend ?? props.label}
    </span>
  </span>
);
