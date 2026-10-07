import {
  animation,
  backgroundImage,
  backgroundPosition,
  backgroundSize,
  borderColor,
  borderRadius,
  cn,
  flex,
  flexShrink,
  height,
  keyframes,
  width,
} from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { reduced } from "../layout.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };

// A light band that sweeps over each bar. Under prefers-reduced-motion the bars stay as plain grey.
const sweep = keyframes({
  from: backgroundPosition("200% 0"),
  to: backgroundPosition("-200% 0"),
});

const bar = cn(
  backgroundImage(
    "linear-gradient(90deg, var(--color-bg-muted) 25%, var(--color-border) 50%, var(--color-bg-muted) 75%)",
  ),
  backgroundSize("200% 100%"),
  animation(sweep, "1.4s", "linear", "infinite"),
  reduced(animation("none")),
);

// The size of a post card at rest: the same frame and surface step as the card, so nothing jumps when it lands.
const card = cn(
  frame().radius(t.radius.xl()).padding(3).border(t.border.width()),
  surface().lighten(0.04),
  borderColor(t.color.border()),
  flex().gap(t.space.sm()),
);
const column = cn(flex().direction("column").gap(t.space.sm()), flexShrink(1), width("100%"));
const disc = cn(
  bar,
  width(t.avatar.feed()),
  height(t.avatar.feed()),
  flexShrink(0),
  borderRadius(t.radius.avatar()),
);
const text = cn(bar, height("0.8em"), borderRadius(t.radius.xs()));
const short = cn(text, width("40%"));
const full = cn(text, width("100%"));
const most = cn(text, width("85%"));

export function SkeletonPost() {
  return (
    <div class={card} aria-hidden="true" data-testid="skeleton">
      <span class={disc} />
      <div class={column}>
        <span class={short} />
        <span class={full} />
        <span class={most} />
      </div>
    </div>
  );
}

export function Skeletons() {
  return (
    <>
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
    </>
  );
}
