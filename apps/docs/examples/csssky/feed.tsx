import { cn, flex, minHeight, padding } from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// The base surface of a list of cards: each card is a tonal step above it, each quote a step from its card.
const feed = cn(
  surface().color(t.color.bgMuted),
  flex().direction("column").gap(t.space.sm),
  padding(t.gutter.compact),
  minHeight("100%"),
);

export function Feed(props: { children?: unknown }) {
  return <div class={feed}>{props.children}</div>;
}
