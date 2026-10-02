import * as css from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import type { JSX } from "@solidjs/web";

import { t } from "../theme.ts" with { type: "cssints" };

// The base surface of a list of cards: each card is a tonal step above it, each quote a step from its card.
const feed = css.cn(
  surface().color(t.color.bgMuted),
  css.flex().direction("column").gap(t.space.sm),
  css.padding(t.gutter.compact),
  css.minHeight("100%"),
);

export function Feed(props: { children?: JSX.Element }) {
  return <div class={feed}>{props.children}</div>;
}
