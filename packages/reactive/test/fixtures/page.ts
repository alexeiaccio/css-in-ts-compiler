// The page of test/browsers.mjs: every case of README.md's model, one per block.
//   a: two independent disclosures (click toggles the owner's attribute, the panel's display and aria-expanded)
//   c: an owner whose state starts true (the runtime writes the attribute on load)
//   t: tabs (a string state, set(), inside(tab, "two"))
//   n: a nested owner (the inner toggle leaves the outer alone)
//   s: a <select> whose change sets a string state from value()
//   f: a checkbox whose change sets a boolean state from checked()
//   m: two on() calls on one element (click and keydown): one joined program, both run
//   d: the same program twice on one element: one toggle per click
import { bg, cn, display } from "cssints" with { type: "cssints" };
import {
  bind,
  checked,
  inside,
  on,
  set,
  state,
  toggle,
  value,
  when,
} from "@cssints/reactive" with { type: "cssints" };

// a panel is hidden until a condition shows it: a plain declaration, below the condition's layer
const hidden = display("none");

const a = state({ open: false });
const b = state({ open: false });
export const aCard = cn(a.owner, when(a.open)(bg("#ffe0e0")));
export const aButton = cn(on({ click: toggle(a.open) }), bind({ "aria-expanded": a.open }));
export const aPanel = cn(hidden, inside(a.open)(display("block")));
export const bCard = cn(b.owner);
export const bButton = cn(on({ click: toggle(b.open) }), bind({ "aria-expanded": b.open }));
export const bPanel = cn(hidden, inside(b.open)(display("block")));

const c = state({ open: true });
export const cCard = cn(c.owner);
export const cButton = cn(bind({ "aria-expanded": c.open }));
export const cPanel = cn(hidden, inside(c.open)(display("block")));

const tabs = state({ tab: "two" });
export const tabList = cn(tabs.owner, display("flex"));
export const tabOne = cn(on({ click: set(tabs.tab, "one") }), bind({ "data-current": tabs.tab }));
export const tabTwo = cn(on({ click: set(tabs.tab, "two") }), bind({ "data-current": tabs.tab }));
export const panelOne = cn(hidden, inside(tabs.tab, "one")(display("block")));
export const panelTwo = cn(hidden, inside(tabs.tab, "two")(display("block")));

const outer = state({ open: false });
const inner = state({ open: false });
export const outerCard = cn(outer.owner);
export const outerButton = cn(
  on({ click: toggle(outer.open) }),
  bind({ "aria-expanded": outer.open }),
);
export const outerPanel = cn(hidden, inside(outer.open)(display("block")));
export const innerCard = cn(inner.owner);
export const innerButton = cn(
  on({ click: toggle(inner.open) }),
  bind({ "aria-expanded": inner.open }),
);
export const innerPanel = cn(hidden, inside(inner.open)(display("block")));

// a select drives a string state: change reads target.value (@value), both panels follow it
const select = state({ tab: "one" });
export const selectCard = cn(select.owner);
export const selectField = cn(
  on({ change: set(select.tab, value()) }),
  bind({ "data-current": select.tab }),
);
export const selectOne = cn(hidden, inside(select.tab, "one")(display("block")));
export const selectTwo = cn(hidden, inside(select.tab, "two")(display("block")));

// a checkbox drives a boolean state: change reads target.checked (@checked), the disclosure follows it
const check = state({ open: false });
export const checkCard = cn(check.owner);
export const checkbox = cn(
  on({ change: set(check.open, checked()) }),
  bind({ "aria-expanded": check.open }),
);
export const checkPanel = cn(hidden, inside(check.open)(display("block")));

// two programs on one element: click toggles open, keydown "t" sets tab to "two"; the two on()s are one joined program
const multi = state({ open: false, tab: "one" });
export const multiCard = cn(multi.owner);
export const multiField = cn(
  on({ click: toggle(multi.open) }),
  on({ keydown: set(multi.tab, "two") }),
  bind({ "aria-expanded": multi.open, "data-current": multi.tab }),
);
export const multiOpen = cn(hidden, inside(multi.open)(display("block")));
export const multiTwo = cn(hidden, inside(multi.tab, "two")(display("block")));

// the same program twice on one element: the runtime applies one segment once, so a click is one toggle
const dup = state({ open: false });
export const dupCard = cn(dup.owner);
export const dupButton = cn(on({ click: toggle(dup.open) }), on({ click: toggle(dup.open) }));
export const dupPanel = cn(hidden, inside(dup.open)(display("block")));
