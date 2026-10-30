import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge, omit } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the textarea, `data-part` and the caller's class merged in. */
export type TextareaPartProps = PartProps;

export interface TextareaProps
  extends
    Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "class">,
    Renderable<TextareaPartProps, void> {
  readonly class?: string;
}

// The input on many lines: the same border, padding, radius, focus ring and disabled look, and the invalid state read off
// `aria-invalid`, which `Field.Control` sets. Only the resize handle and the height are a textarea's own.
const textarea = css.cn(
  css.boxSizing("border-box"),
  css.display("block"),
  css.width("100%"),
  css.minHeight(t.space._10),
  css.padding(t.space._2, t.space._3),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.fieldText),
  css.fontSize(t.font.size),
  css.resize("vertical"),
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

/** A multi-line field on the neutral theme: the control `Field` puts in with `render`, and a component on its own. */
export const Textarea = (props: TextareaProps): JSX.Element => {
  const rest = omit(props, "render", "class");
  const merged = merge(rest, () => ({
    "data-part": "textarea",
    class: css.cn(textarea, props.class),
  }));
  return renderPart(props, merged, undefined, (part) => <textarea {...part} />);
};
