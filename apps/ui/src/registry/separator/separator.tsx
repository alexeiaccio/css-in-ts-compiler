import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the rule, `data-part` and the caller's class merged in. */
export type SeparatorPartProps = PartProps;

export interface SeparatorProps extends Renderable<SeparatorPartProps, void> {
  /** `horizontal` is a line across, `vertical` a line in a row of them. */
  readonly orientation?: "horizontal" | "vertical";
  /** A rule between two groups of content, announcing nothing: `role="none"` instead of `role="separator"`. */
  readonly decorative?: boolean;
  readonly class?: string;
}

// A rule is one pixel of the border colour and nothing else. The orientation is a prop, not a state: a decorative rule has
// no `aria-orientation` to read (ARIA on `role="none"` is ignored), so the look reads `data-orientation` and the ARIA is
// the extra attribute a real separator announces. A vertical rule stretches with the row it divides.
const separator = css.cn(css.flexShrink(0), css.bg(t.color.border));

const horizontal = css.cn(css.height("1px"), css.width("100%"));

const vertical = css.cn(css.height("auto"), css.width("1px"), css.alignSelf("stretch"));

/**
 * A separator: a `role="separator"` rule between two groups of content, with `aria-orientation` when it is one, or a
 * `role="none"` one (`decorative`) that only draws the line.
 */
export const Separator = (props: SeparatorProps): JSX.Element => {
  const own = {
    "data-part": "separator",
    "data-orientation": props.orientation ?? "horizontal",
    role: props.decorative === true ? "none" : "separator",
    "aria-orientation": props.decorative === true ? undefined : (props.orientation ?? "horizontal"),
    get class() {
      return css.cn(
        separator,
        props.orientation === "vertical" ? vertical : horizontal,
        props.class,
      );
    },
  } as PartProps;
  return renderPart(props, own, undefined, (part) => <div {...part} />);
};
