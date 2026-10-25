import "virtual:cssints.css";

import { createSwitch } from "@cssints/headless";
import { reset } from "@cssints/reset" with { type: "cssints" };
import { render } from "@solidjs/web";
import {
  alignItems,
  attr,
  bg,
  border,
  borderColor,
  borderRadius,
  color,
  cn,
  cursor,
  display,
  focusVisible,
  fontSize,
  gap,
  hover,
  minHeight,
  outline,
  outlineOffset,
  padding,
  placeItems,
} from "cssints" with { type: "cssints" };

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
        bg(t.color.page),
      )}
    >
      {/* Every colour and size comes from the theme, and the checked look is the switch's own `aria-checked`, so the
          widget adds no state of its own. */}
      <button
        {...sw.switchProps}
        class={cn(
          display("flex"),
          alignItems("center"),
          gap(t.space._2),
          padding(t.space._2, t.space._3),
          border("1px solid", t.color.border),
          borderRadius("999px"),
          bg(t.color.surface),
          color(t.color.text),
          fontSize(t.font.size),
          cursor("pointer"),
          hover(borderColor(t.color.borderHover)),
          focusVisible(outline("2px solid", t.color.focusRing), outlineOffset("2px")),
          attr("aria-checked", "true")(
            bg(t.color.highlight),
            color(t.color.onHighlight),
            borderColor(t.color.highlight),
          ),
        )}
      >
        {sw.checked() ? "On" : "Off"}
      </button>
    </div>
  );
};

// The build runs this module to collect its classes, and there it is the server build of Solid, which has no render: only the
// page mounts.
if (!import.meta.env.SSR) {
  render(() => <Switch />, document.getElementById("root")!);
}
