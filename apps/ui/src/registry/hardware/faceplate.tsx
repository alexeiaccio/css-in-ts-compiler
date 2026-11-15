import type { JSX } from "@solidjs/web";

// The skin's sheet, imported once and only here: every part's look is scoped to `[data-skin="01"]`, which this panel is the
// one thing that sets, so a skin without a faceplate has nothing to paint.
import "./skin.css";

/**
 * A key colour: the one colour the whole skin is turned into roles from, as OKLCH. A dial's pointer, a key's cap, a lit lamp
 * and the focus ring are all derived from it (see `tokens-01.css`), so a host never picks a second colour.
 */
export interface KeyColor {
  /** Lightness, 0..1. Above 0.68 the key counts as light: its ink goes near-black and the colour comes back as a marker. */
  readonly l: number;
  /** Chroma, 0..~0.4. 0 is a neutral key. */
  readonly c: number;
  /** Hue in degrees, 0..360. */
  readonly h: number;
}

/** Black keys: the skin's default, and the same numbers the sheet starts from. */
export const BLACK_KEYS: KeyColor = { l: 0.24, c: 0, h: 0 };

export interface FaceplateProps {
  /** The printed legend across the top of the panel: the device's name, set small and spaced. */
  readonly title?: string | undefined;
  /** The panel's key colour (default `BLACK_KEYS`), which every part on it is derived from. */
  readonly keyColor?: KeyColor | undefined;
  readonly children?: JSX.Element;
}

/**
 * The moulded panel every part of skin 01 stands on: a light grey surface with a lit top edge, a rim of hairline and a shadow
 * tinted with the panel's own hue, carrying the one colour the rest of the skin derives from.
 *
 * It is also the skin's scope: `data-skin="01"` is set here and nowhere else, so a part outside a faceplate is deliberately
 * unpainted, and `keyColor` is written as the three numbers `tokens-01.css` reads (`--theme-l`, `--theme-c`, `--theme-h`).
 */
export const Faceplate = (props: FaceplateProps): JSX.Element => {
  const colour = (): KeyColor => props.keyColor ?? BLACK_KEYS;
  return (
    <div
      data-skin="01"
      data-part="faceplate"
      style={{
        "--theme-l": String(colour().l),
        "--theme-c": String(colour().c),
        "--theme-h": String(colour().h),
      }}
    >
      {props.title === undefined ? undefined : (
        <span data-part="faceplate-title">{props.title}</span>
      )}
      {props.children}
    </div>
  );
};
