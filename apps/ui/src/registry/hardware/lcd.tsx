import type { JSX } from "@solidjs/web";

export interface LcdProps {
  /** The printed tag over the readout: a static legend, not a live region. */
  readonly tag?: string | undefined;
  /**
   * The value the screen shows. It is the screen's live region — `role="status"`, `aria-live="polite"` — because a value
   * that changes is announced; a screen of static text is not (`children`).
   */
  readonly value?: string | undefined;
  /** Static text on the glass. It is never a live region: nothing announces it, because nothing changes it. */
  readonly children?: JSX.Element;
}

/**
 * The screen: a recessed window of gray reflective glass with dark print, its own faint grid, and the print a hair above the
 * glass. There is no primitive behind it — a readout has no contract to keep — so this part is the one place the skin takes
 * the live region seriously itself: only `value` is one.
 */
export const Lcd = (props: LcdProps): JSX.Element => (
  <div data-part="lcd">
    {props.tag === undefined ? undefined : <span data-part="lcd-tag">{props.tag}</span>}
    {props.value === undefined ? undefined : (
      <span data-part="lcd-value" role="status" aria-live="polite">
        {props.value}
      </span>
    )}
    {props.children === undefined ? undefined : <span data-part="lcd-body">{props.children}</span>}
  </div>
);
