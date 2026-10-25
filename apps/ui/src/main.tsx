import "virtual:cssints.css";

import { createSwitch } from "@cssints/headless";
import { reset } from "@cssints/reset" with { type: "cssints" };
import { render } from "@solidjs/web";
import {
  alignItems,
  attr,
  border,
  borderRadius,
  color,
  cn,
  cursor,
  display,
  focusVisible,
  fontSize,
  gap,
  height,
  justifyContent,
  minHeight,
  outline,
  outlineOffset,
  padding,
  placeItems,
  width,
} from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// The reset (border-box, no margins) below every style of the sheet; the switch below is the only thing on the page.
reset();

const Switch = () => {
  const sw = createSwitch({ defaultValue: true });
  return (
    <div
      class={cn(
        display("grid"),
        placeItems("center"),
        minHeight("100dvh"),
        padding(t.space._8),
        // The page is the outermost surface: everything below is that colour with its lightness moved, so a card, a row and a
        // field stay related without naming a colour twice.
        surface().color(t.color.page),
      )}
    >
      {/* A card and the row inside it are both frames: the card names the only radius and the padding, and the row inherits the
          inner radius (16px less 8px of padding and 1px of border, so 7px) without writing one. A third frame inside would
          follow the row the same way. */}
      <div
        class={cn(frame().radius(t.radius.xl).padding(2).border("1px"), surface().lighten(0.05))}
      >
        <div
          class={cn(
            frame().padding(2),
            surface().darken(0.04),
            display("flex"),
            alignItems("center"),
            justifyContent("space-between"),
            gap(t.space._4),
          )}
        >
          <span class={cn(fontSize(t.font.size), color(t.color.text))}>
            {sw.checked() ? "On" : "Off"}
          </span>
          {/* The track is a pill rather than concentric, so it is no frame; the thumb is a circle of its own. The checked look
              is the switch's own `aria-checked`, so the widget adds no state of its own. */}
          <button
            {...sw.switchProps}
            class={cn(
              display("flex"),
              alignItems("center"),
              width("2.5rem"),
              height("1.5rem"),
              padding("2px"),
              border("0"),
              borderRadius("999px"),
              cursor("pointer"),
              surface().color(t.color.border),
              focusVisible(outline("2px solid", t.color.focusRing), outlineOffset("2px")),
              attr("aria-checked", "true")(
                surface().color(t.color.highlight),
                justifyContent("flex-end"),
              ),
            )}
          >
            <span
              class={cn(
                display("block"),
                width("1.25rem"),
                height("1.25rem"),
                borderRadius("999px"),
                surface().color(t.color.surface),
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// The build runs this module to collect its classes, and there it is the server build of Solid, which has no render: only the
// page mounts.
if (!import.meta.env.SSR) {
  render(() => <Switch />, document.getElementById("root")!);
}
