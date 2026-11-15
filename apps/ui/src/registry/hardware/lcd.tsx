import type { JSX } from "@solidjs/web";

export interface LcdProps {
  /** The printed tag over the glass: a static legend on the panel, not on the screen and not a live region. */
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
 * The screen: a dark window sunk into the panel, its figure lit in the key's glow and its prose dim behind the glass. There is
 * no primitive behind it — a readout has no contract to keep — so this part is the one place the skin takes the live region
 * seriously itself: only `value` is one.
 *
 * The glass has two body slots because it has two voices: the figure is the lamp (`lcd-value`), anything else is prose
 * (`lcd-body`, the system sans). The tag is printed on the panel, above the well, like every other legend in this skin.
 */
export const Lcd = (props: LcdProps): JSX.Element => (
  <div data-part="lcd">
    {props.tag === undefined ? undefined : <span data-part="lcd-tag">{props.tag}</span>}
    <div data-part="lcd-screen">
      {props.value === undefined ? undefined : (
        <span data-part="lcd-value" role="status" aria-live="polite">
          {props.value}
        </span>
      )}
      {props.children === undefined ? undefined : (
        <span data-part="lcd-body">{props.children}</span>
      )}
    </div>
  </div>
);
