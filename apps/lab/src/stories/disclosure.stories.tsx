// A disclosure with no JavaScript state and no event handlers: the button's click and its aria-expanded are classes of
// @cssints/reactive, and the panel's display is a condition on the owner. The runtime that writes them ships from the
// package (one script for every target), so the story is markup and classes only.
import {
  alignItems,
  attr,
  bg,
  border,
  borderRadius,
  cn,
  color,
  cursor,
  display,
  fontSize,
  fontWeight,
  hover,
  justifyContent,
  margin,
  overflow,
  padding,
  textAlign,
  width,
} from "cssints" with { type: "cssints" };
import { bind, inside, on, state, toggle } from "@cssints/reactive" with { type: "cssints" };

import type { Meta, Story } from "../csf.ts";
import { t } from "../theme.ts" with { type: "cssints" };

const frame = cn(
  border("1px solid", t.color.border),
  borderRadius(t.radius.md),
  overflow("hidden"),
);

// The button reads the aria-expanded its own bind() writes: the style is not a second copy of the state.
const trigger = cn(
  display("flex"),
  alignItems("center"),
  justifyContent("space-between"),
  width("100%"),
  padding("12px 14px"),
  bg("transparent"),
  color(t.color.text),
  fontSize(t.fontSize.md),
  fontWeight("600"),
  textAlign("left"),
  cursor("pointer"),
  hover(bg(t.color.accentSoft)),
  attr("aria-expanded", "true")(bg(t.color.accentSoft)),
);

// Closed is display: none, not the hidden attribute: a condition cannot unset an attribute.
const hidden = display("none");

const panel = cn(padding("0 14px 12px"), fontSize(t.fontSize.sm), color(t.color.muted));

const body = margin(0);

// The initial value is the state's own, written by the runtime on load (no persistence, no script to run). Two owners,
// one per story, because the classes of a state are built at build time.
const closed = state({ open: false });
const opened = state({ open: true });

const closedFrame = cn(closed.owner, frame);
const closedButton = cn(
  on({ click: toggle(closed.open) }),
  // aria-controls is a literal id: bind() writes it as is, beside the state it binds.
  bind({ "aria-expanded": closed.open, "aria-controls": "disclosure-closed-panel" }),
  trigger,
);
const closedPanel = cn(hidden, inside(closed.open)(display("block")), panel);

const openedFrame = cn(opened.owner, frame);
const openedButton = cn(
  on({ click: toggle(opened.open) }),
  bind({ "aria-expanded": opened.open }),
  trigger,
);
const openedPanel = cn(hidden, inside(opened.open)(display("block")), panel);

const meta = {
  title: "CSS interactions/Disclosure",
} satisfies Meta;

export default meta;

export const Closed: Story = {
  render: () => (
    <div class={closedFrame}>
      <button type="button" id="disclosure-closed-btn" class={closedButton}>
        How it holds its state
      </button>
      <div id="disclosure-closed-panel" class={closedPanel}>
        <p class={body}>
          open is a custom property on this card. The click toggles it, aria-expanded is bound from
          it, and this panel is display: none until the card holds data-reactive-open="true".
        </p>
      </div>
    </div>
  ),
};

export const Open: Story = {
  render: () => (
    <div class={openedFrame}>
      <button type="button" id="disclosure-open-btn" class={openedButton}>
        Open before the first paint
      </button>
      <div id="disclosure-open-panel" class={openedPanel}>
        <p class={body}>
          The state starts true. The runtime writes the attribute and the binding on load, so a
          reload shows this panel without a click and without JavaScript state.
        </p>
      </div>
    </div>
  ),
};
