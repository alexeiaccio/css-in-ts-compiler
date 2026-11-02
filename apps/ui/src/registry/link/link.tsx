import { createLink } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { merge } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** The link's state, as accessors: `render` can branch on it without a re-render. */
export interface LinkState {
  /** A native `<a href>`, or the custom `role=link` element. */
  readonly native: () => boolean;
  readonly disabled: () => boolean;
  /** The current page of a trail (`aria-current="page"`). */
  readonly current: () => boolean;
}

/** What `render` gets: the link's props, its class merged with the caller's, and `data-part`. */
export type LinkPartProps = PartProps;

export interface LinkProps extends Renderable<LinkPartProps, LinkState> {
  /** Where the link goes. A link with an `href` is a native `<a>`. */
  readonly href?: string | undefined;
  /** Force a native `<a href>` (the default with `href`) or a custom `role=link` element. */
  readonly native?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  /** The current page of a trail: `aria-current="page"`. */
  readonly current?: boolean | undefined;
  /** `muted` is the quieter colour a secondary link wears. */
  readonly tone?: "default" | "muted";
  /** The link ran (Enter or a pointer), before `onNavigate`. */
  readonly onActivate?: (() => void) | undefined;
  /** Router integration: where the activation would navigate. */
  readonly onNavigate?: ((href: string) => void) | undefined;
  readonly class?: string | undefined;
  readonly children?: JSX.Element;
}

// A link is underlined text at the theme's link colour, and the underline is what carries the affordance, so a muted tone
// only changes the colour. The current page is weight and colour together, never colour alone (WCAG 1.4.1), and a disabled
// link greys and drops the pointer, while its `aria-disabled` keeps it in the accessibility tree.
const link = css.cv({
  base: css.cn(
    css.textDecoration("underline"),
    css.textUnderlineOffset("0.2em"),
    css.borderRadius(t.radius.sm),
    css.cursor("pointer"),
    css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
    css.attr("aria-current", "page")(
      css.color(t.color.text),
      css.fontWeight("600"),
      css.hover(css.color(t.color.text)),
    ),
    css.attr("aria-disabled", "true")(
      css.color(t.color.textDisabled),
      css.cursor("default"),
      css.hover(css.color(t.color.textDisabled)),
    ),
  ),
  variants: {
    tone: {
      default: css.cn(css.color(t.color.link), css.hover(css.color(t.color.linkPressed))),
      muted: css.cn(css.color(t.color.muted), css.hover(css.color(t.color.text))),
    },
  },
  defaultVariants: { tone: "default" },
});

/**
 * APG link, styled: `createLink` decides whether the element is a native `<a href>` (the default with `href`) or a custom
 * `role=link` with `tabindex=0` and Enter, and owns `aria-current`, `aria-disabled` and the activation callbacks. The skin
 * adds the theme's colour, the underline and its offset, the focus ring, the current page's weight+colour and the disabled
 * grey. No role is invented here: the primitive's `role` is spread unchanged (`undefined` on the native anchor).
 */
export const Link = (props: LinkProps): JSX.Element => {
  const control = createLink({
    get href() {
      return props.href;
    },
    get native() {
      return props.native;
    },
    get disabled() {
      return props.disabled;
    },
    get current() {
      return props.current;
    },
    get onActivate() {
      return props.onActivate;
    },
    get onNavigate() {
      return props.onNavigate;
    },
  });
  const state: LinkState = {
    native: control.native,
    disabled: control.disabled,
    current: () => props.current === true,
  };
  const own = merge(control.linkProps, () => ({
    "data-part": "link",
    get class() {
      return css.cn(link({ tone: props.tone }), props.class);
    },
  }));
  return renderPart(props, own, state, (part) => <a {...part}>{props.children}</a>);
};
