// Tabs with no JavaScript state and no event handlers: three buttons, one owner's state, and the panels shown by
// conditions. The story exists to pin down what @cssints/reactive can write honestly.
//
// The shape the package asks for is one string state — state({ tab: "one" }), on({ click: set(ui.tab, "two") }),
// inside(ui.tab, "one")(...) — and it works for the panels and for a bound data-current (the value "one", "two").
// It cannot write aria-selected: bind() writes a state's value into the attribute, and aria-selected accepts only
// "true"/"false", so a string state would announce aria-selected="one" (an invalid value, read as false by assistive
// technology). CSS cannot write an attribute either — attr() is a condition, not a declaration — so `when(ui.tab, "one")`
// around `attr("aria-selected", "true")` is not a way out. The honest shape is one boolean per tab: each tab binds its own
// false/true, and a click writes all three (one flush), so the selection is a single truth in CSS and the ARIA is real.
//
// What this costs: three states and three writes per click instead of one string state and one write, and the roving
// tabindex of the APG tabs pattern is not expressible (tabindex bound to a boolean would be "true"/"false"), so every tab
// stays tabbable and Enter/Space activates it — not the arrow-key pattern the headless Tabs story demonstrates.
import {
  attr,
  bg,
  border,
  borderBottom,
  cn,
  color,
  cursor,
  display,
  fontSize,
  fontWeight,
  hover,
  margin,
  marginBottom,
  padding,
} from "cssints" with { type: "cssints" };
import { bind, inside, on, set, state } from "@cssints/reactive" with { type: "cssints" };

import type { Meta, Story } from "../csf.ts";
import { t } from "../theme.ts" with { type: "cssints" };

const owner = state({ one: true, two: false, three: false });

// The panels are display: none until their tab is the one the owner holds.
const hidden = display("none");

const list = cn(display("flex"), borderBottom("1px solid", t.color.border));

const tab = cn(
  padding("8px 12px"),
  bg("transparent"),
  border("none"),
  borderBottom("2px solid", "transparent"),
  color(t.color.muted),
  fontSize(t.fontSize.md),
  cursor("pointer"),
  marginBottom("-1px"),
  hover(color(t.color.text)),
  // the aria-selected the tab bound for itself, as in the headless stories
  attr("aria-selected", "true")(
    color(t.color.accent),
    borderBottom("2px solid", t.color.accent),
    fontWeight("600"),
  ),
);

const panel = cn(padding("16px 2px"), fontSize(t.fontSize.sm), color(t.color.muted));

const body = margin(0);

const card = owner.owner;

// One action list per tab: set its own state true and the other two false, in one event and one flush. Written out, not
// built by a helper: the arguments of on() and set() are evaluated at build time, so a parameter is a build error.
const tabOne = cn(
  on({ click: [set(owner.one, true), set(owner.two, false), set(owner.three, false)] }),
  bind({ "aria-selected": owner.one }),
  tab,
);
const tabTwo = cn(
  on({ click: [set(owner.one, false), set(owner.two, true), set(owner.three, false)] }),
  bind({ "aria-selected": owner.two }),
  tab,
);
const tabThree = cn(
  on({ click: [set(owner.one, false), set(owner.two, false), set(owner.three, true)] }),
  bind({ "aria-selected": owner.three }),
  tab,
);

const panelOne = cn(hidden, inside(owner.one)(display("block")), panel);
const panelTwo = cn(hidden, inside(owner.two)(display("block")), panel);
const panelThree = cn(hidden, inside(owner.three)(display("block")), panel);

const meta = {
  title: "CSS interactions/Tabs",
} satisfies Meta;

export default meta;

export const Boolean: Story = {
  render: () => (
    <div class={card}>
      <div class={list} role="tablist" aria-label="CSS-first tabs">
        <button type="button" role="tab" id="reactive-tab-one" class={tabOne}>
          One
        </button>
        <button type="button" role="tab" id="reactive-tab-two" class={tabTwo}>
          Two
        </button>
        <button type="button" role="tab" id="reactive-tab-three" class={tabThree}>
          Three
        </button>
      </div>
      <div role="tabpanel" id="reactive-panel-one" class={panelOne}>
        <p class={body}>
          The owner holds one, two and three. This panel is inside(owner.one), the tab binds its own
          aria-selected, and the click wrote all three states before the frame was painted.
        </p>
      </div>
      <div role="tabpanel" id="reactive-panel-two" class={panelTwo}>
        <p class={body}>
          The second panel. A string state would be enough for the panels, but not for
          aria-selected: bind() writes the state's value, so "two" would be announced as a selection
          value.
        </p>
      </div>
      <div role="tabpanel" id="reactive-panel-three" class={panelThree}>
        <p class={body}>
          The third panel. No constant tabindex is set, so Tab reaches every tab; the arrow keys are
          not in this API.
        </p>
      </div>
    </div>
  ),
};
