import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the label, `data-part` and the caller's class merged in. */
export type BadgePartProps = PartProps;

export interface BadgeProps extends Renderable<BadgePartProps, void> {
  /** `neutral` is the quiet fill, `accent` the highlighted one, `quiet` a label with no fill. */
  readonly tone?: "neutral" | "accent" | "quiet";
  readonly class?: string;
  readonly children?: JSX.Element;
}

// A badge is a small label, fully round. The theme's radius steps stop at 16px (`radius.xl`), and a pill has to be rounder
// than half of its own height whatever that height is, so the value is 999px by hand: not a step, so not a token.
const badge = css.cv({
  base: css.cn(
    css.boxSizing("border-box"),
    css.display("inline-flex"),
    css.alignItems("center"),
    css.gap(t.space._1),
    css.width("max-content"),
    css.paddingBlock(t.space._1),
    css.paddingInline(t.space._2),
    css.border("1px solid", "transparent"),
    css.borderRadius("999px"),
    css.fontSize(t.font.sizeSm),
    css.fontWeight("500"),
    css.lineHeight(1),
    css.whiteSpace("nowrap"),
  ),
  variants: {
    tone: {
      neutral: css.cn(css.bg(t.color.buttonBackground), css.color(t.color.text)),
      accent: css.cn(css.bg(t.color.highlight), css.color(t.color.onHighlight)),
      quiet: css.cn(
        css.bg("transparent"),
        css.color(t.color.muted),
        css.border("1px solid", t.color.border),
      ),
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** A badge: a small label for a state or a count, in one of three tones and always fully round. */
export const Badge = (props: BadgeProps): JSX.Element => {
  const own = {
    "data-part": "badge",
    get class() {
      return css.cn(badge({ tone: props.tone }), props.class);
    },
  } as PartProps;
  return renderPart(props, own, undefined, (part) => <span {...part}>{props.children}</span>);
};
