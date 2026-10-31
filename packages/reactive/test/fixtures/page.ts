// The page of test/browsers.mjs: every case of README.md's model, one per block.
//   a: two independent disclosures (click toggles the owner's attribute, the panel's display and aria-expanded)
//   c: an owner whose state starts true (the runtime writes the attribute on load)
//   t: tabs (a string state, set(), inside(tab, "two"))
//   n: a nested owner (the inner toggle leaves the outer alone)
import { bg, cn, display } from "cssints" with { type: "cssints" };
import {
  bind,
  inside,
  on,
  set,
  state,
  toggle,
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
