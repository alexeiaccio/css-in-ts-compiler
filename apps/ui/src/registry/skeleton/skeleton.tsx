import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the box, `data-part` and the caller's class merged in. */
export type SkeletonPartProps = PartProps;

export interface SkeletonProps extends Renderable<SkeletonPartProps, void> {
  /** Any width: `"12rem"`, `"60%"`; the default fills its container. */
  readonly width?: string;
  /** Any height; the default is one spacing step. */
  readonly height?: string;
  readonly class?: string;
}

// A placeholder is a filled box with a pulse. The pulse is the only motion in the kit, so it is also the only place that
// reads the preference: the animation is declared inside `prefers-reduced-motion: no-preference`, which leaves a still box
// for a reader who asked for less motion instead of a second rule that turns the first one off.
const pulse = css.keyframes({ from: css.opacity(1), to: css.opacity(0.45) });

const skeleton = css.cn(
  css.display("block"),
  css.width("100%"),
  css.height(t.space._4),
  css.borderRadius(t.radius.md),
  css.bg(t.color.buttonBackground),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.animation(pulse, "1.6s", "ease-in-out", "infinite", "alternate"),
  ),
);

/**
 * A skeleton: a box that holds the place of content that is still loading. It has no text of its own, so it is
 * `aria-hidden`: the loading state is the page's to announce, not a placeholder's.
 */
export const Skeleton = (props: SkeletonProps): JSX.Element => {
  const own = {
    "data-part": "skeleton",
    "aria-hidden": "true",
    // a runtime width is not a class; the defaults are in the class, and a prop overrides one of them here
    style: { width: props.width, height: props.height },
    get class() {
      return css.cn(skeleton, props.class);
    },
  } as PartProps;
  return renderPart(props, own, undefined, (part) => <div {...part} />);
};
