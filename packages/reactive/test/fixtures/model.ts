// The page of test/scenarios.mjs: the bounded instance of specs/patterns/reactive.qnt (bean cssints-tm9j).
//   outer: owner (open=false, tab="one"), a keydown program on the owner element itself, a source
//          binding, a two-tab strip (a comparison, a choice and a literal), a <select> (@value) and
//          an inside(open) condition
//   inner: owner nested in outer (open=false, tab="two"), the same strip, a checkbox (@checked) and
//          its own inside(open) condition
// The ids are the model's parts; the two owners start on opposite tabs, so a value read from the
// wrong owner shows at once.
import { cn, display } from "cssints" with { type: "cssints" };
import {
  bind,
  checked,
  either,
  equals,
  inside,
  on,
  set,
  state,
  toggle,
  value,
} from "@cssints/reactive" with { type: "cssints" };

const hidden = display("none");

const outer = state({ open: false, tab: "one" });
const inner = state({ open: false, tab: "two" });

export const outerCard = cn(outer.owner, on({ keydown: set(outer.open, true) }));
export const outerButton = cn(
  on({ click: toggle(outer.open) }),
  bind({ "aria-expanded": outer.open }),
);
export const outerTabOne = cn(
  on({ click: set(outer.tab, "one") }),
  bind({
    "aria-selected": equals(outer.tab, "one"),
    "aria-controls": "panel-1",
    tabindex: either(equals(outer.tab, "one"), "0", "-1"),
  }),
);
export const outerTabTwo = cn(
  on({ click: set(outer.tab, "two") }),
  bind({
    "aria-selected": equals(outer.tab, "two"),
    tabindex: either(equals(outer.tab, "two"), "0", "-1"),
  }),
);
export const outerField = cn(
  on({ change: set(outer.tab, value()) }),
  bind({ "data-current": outer.tab }),
);
export const outerPanel = cn(hidden, inside(outer.open)(display("block")));

export const innerCard = cn(inner.owner);
export const innerButton = cn(
  on({ click: toggle(inner.open) }),
  bind({ "aria-expanded": inner.open }),
);
export const innerTabOne = cn(
  on({ click: set(inner.tab, "one") }),
  bind({
    "aria-selected": equals(inner.tab, "one"),
    "aria-controls": "panel-1",
    tabindex: either(equals(inner.tab, "one"), "0", "-1"),
  }),
);
export const innerTabTwo = cn(
  on({ click: set(inner.tab, "two") }),
  bind({
    "aria-selected": equals(inner.tab, "two"),
    tabindex: either(equals(inner.tab, "two"), "0", "-1"),
  }),
);
export const innerCheck = cn(
  on({ change: set(inner.open, checked()) }),
  bind({ "data-checked": inner.open }),
);
export const innerPanel = cn(hidden, inside(inner.open)(display("block")));
