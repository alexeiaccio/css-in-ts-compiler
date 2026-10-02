import { _cv } from "cssints";
import {
  background,
  border,
  borderBottom,
  borderRadius,
  bottom,
  cn,
  color,
  cursor,
  cv,
  flex,
  flexGrow,
  focusVisible,
  fontSize,
  fontWeight,
  height,
  hover,
  left,
  minHeight,
  outline,
  outlineOffset,
  padding,
  position,
  top,
  transition,
  zIndex,
} from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import { For } from "solid-js";

import { reduced } from "../layout.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };

// Sticky under the header (which is 52 px, t.layout.headerHeight); a surface of the page colour, and a tab a step darker on hover.
const bar = cn(
  position("sticky"),
  top(t.layout.headerHeight),
  zIndex(4),
  flex(),
  surface().color(t.color.bg),
  borderBottom(t.border.width, "solid", t.color.border),
);

const tab = _cv(
  cv({
    base: cn(
      flexGrow(1),
      cursor("pointer"),
      border("0"),
      fontSize(t.fontSize.md),
      minHeight(t.layout.navItem),
      padding(t.space.sm),
      surface().color(t.color.bg),
      hover(surface().darken(0.03)),
      focusVisible(outline("2px solid", t.color.accent), outlineOffset("-2px")),
    ),
    variants: {
      active: {
        yes: cn(fontWeight(t.fontWeight.bold), color(t.color.text)),
        no: cn(fontWeight(t.fontWeight.medium), color(t.color.textMedium)),
      },
    },
    defaultVariants: { active: "no" },
  }),
);

// One indicator under all the tabs, as wide as one tab: it slides to the active one. Position and width are the only inline
// style (an index and a count are not known to the sheet); the slide is a transition, off under prefers-reduced-motion.
const indicator = cn(
  position("absolute"),
  left("0"),
  bottom("0"),
  height("3px"),
  borderRadius(t.radius.full),
  background(t.color.accent),
  transition("transform 250ms ease-out"),
  reduced(transition("none")),
);

export function Tabs(props: {
  names: readonly string[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div class={bar} role="tablist">
      <For each={props.names}>
        {(name, i) => (
          <button
            role="tab"
            type="button"
            class={tab({ active: i() === props.active ? "yes" : "no" })}
            aria-selected={i() === props.active ? "true" : "false"}
            onClick={() => props.onSelect(i())}
          >
            {name}
          </button>
        )}
      </For>
      <span
        class={indicator}
        data-testid="indicator"
        style={{
          width: `${100 / props.names.length}%`,
          transform: `translateX(${props.active * 100}%)`,
        }}
      />
    </div>
  );
}
