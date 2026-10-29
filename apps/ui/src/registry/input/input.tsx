import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, omit } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the input, `data-part` and the caller's class merged in. */
export type InputPartProps = PartProps;

export interface InputProps
  extends
    Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class">,
    Renderable<InputPartProps, void> {
  readonly class?: string;
}

// A text field: one border, one radius, the focus ring a control wears, and the invalid state the field announces with
// aria-invalid rather than a class of its own.
const input = css.cn(
  css.boxSizing("border-box"),
  css.display("block"),
  css.width("100%"),
  css.padding(t.space._2, t.space._3),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.fieldText),
  css.fontSize(t.font.size),
  css.hover(css.border("1px solid", t.color.borderHover)),
  css.focusVisible(
    css.outline("2px solid", t.color.focusRing),
    css.outlineOffset("2px"),
    css.border("1px solid", t.color.focusRing),
  ),
  css.attr("aria-invalid", "true")(
    css.border("1px solid", t.color.invalid),
    css.outline("2px solid", t.color.invalid),
  ),
  css.attr("aria-disabled", "true")(
    css.bg(t.color.page),
    css.color(t.color.textDisabled),
    css.border("1px solid", t.color.borderDisabled),
    css.cursor("not-allowed"),
  ),
);

/** An input on the neutral theme: a part of `Field` by default, and a component on its own. */
export const Input = (props: InputProps): JSX.Element => {
  const rest = omit(props, "render", "class");
  const merged = merge(rest, () => ({ "data-part": "input", class: css.cn(input, props.class) }));
  return renderPart(props, merged, undefined, (part) => <input {...part} />);
};
