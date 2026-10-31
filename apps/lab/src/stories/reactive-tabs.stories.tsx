// Tabs with no JavaScript state and no event handlers: three buttons, one string state, and the panels shown by
// conditions. The tab strip is the case bind() was missing: aria-selected must be "true"/"false" while the state holds
// "one"/"two"/"three", aria-controls must be a literal id, and the roving tabindex is "0" for the selected tab and "-1"
// for the rest. A comparison says exactly that (equals(ui.tab, "one")), either() picks between the two tabindex literals,
// and a plain string writes the id as is, so one click writes one state and the runtime derives all three attributes from
// the nearest owner in the same flush.
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
import {
  bind,
  either,
  equals,
  inside,
  on,
  set,
  state,
} from "@cssints/reactive" with { type: "cssints" };

import type { Meta, Story } from "../csf.ts";
import { t } from "../theme.ts" with { type: "cssints" };

const owner = state({ tab: "one" });

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

// One string state, three comparisons: equals() for aria-selected, either() for the roving tabindex, a literal for the
// panel id. Written out, not built by a helper: the arguments of on() and bind() are evaluated at build time, so a
// parameter is a build error.
const tabOne = cn(
  on({ click: set(owner.tab, "one") }),
  bind({
    "aria-selected": equals(owner.tab, "one"),
    "aria-controls": "reactive-panel-one",
    tabindex: either(equals(owner.tab, "one"), "0", "-1"),
  }),
  tab,
);
const tabTwo = cn(
  on({ click: set(owner.tab, "two") }),
  bind({
    "aria-selected": equals(owner.tab, "two"),
    "aria-controls": "reactive-panel-two",
    tabindex: either(equals(owner.tab, "two"), "0", "-1"),
  }),
  tab,
);
const tabThree = cn(
  on({ click: set(owner.tab, "three") }),
  bind({
    "aria-selected": equals(owner.tab, "three"),
    "aria-controls": "reactive-panel-three",
    tabindex: either(equals(owner.tab, "three"), "0", "-1"),
  }),
  tab,
);

const panelOne = cn(hidden, inside(owner.tab, "one")(display("block")), panel);
const panelTwo = cn(hidden, inside(owner.tab, "two")(display("block")), panel);
const panelThree = cn(hidden, inside(owner.tab, "three")(display("block")), panel);

const meta = {
  title: "CSS interactions/Tabs",
} satisfies Meta;

export default meta;

export const Computed: Story = {
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
          The owner holds one value, "one". This tab's aria-selected is equals(owner.tab, "one"),
          its aria-controls is the literal id, and its tabindex is either(equals(owner.tab, "one"),
          "0", "-1"). A click writes "one" and the runtime derives all three in one flush.
        </p>
      </div>
      <div role="tabpanel" id="reactive-panel-two" class={panelTwo}>
        <p class={body}>
          The second panel. The tab compares the same state with "two", so its aria-selected and
          tabindex follow the owner rather than a second copy of the selection.
        </p>
      </div>
      <div role="tabpanel" id="reactive-panel-three" class={panelThree}>
        <p class={body}>
          The third panel. The roving tabindex puts one tab in the tab order and the other two at
          "-1", as the APG tabs pattern asks; the arrow keys are still the app's own concern.
        </p>
      </div>
    </div>
  ),
};
