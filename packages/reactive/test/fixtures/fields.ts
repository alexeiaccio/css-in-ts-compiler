// The field's value (`value()`, `checked()`) and several programs on one element: two on()s in one cn() append their
// segments and two binds() their attributes, so the element's program and binding are one property each.
import { cn } from "cssints" with { type: "cssints" };

import {
  bind,
  checked,
  on,
  set,
  state,
  toggle,
  value,
} from "@cssints/reactive" with { type: "cssints" };

const ui = state({ tab: "one", open: false });

export const select = cn(on({ change: set(ui.tab, value()) }), bind({ "aria-current": ui.tab }));
export const check = cn(
  on({ change: set(ui.open, checked()) }),
  bind({ "aria-expanded": ui.open }),
);
export const both = cn(
  on({ click: toggle(ui.open) }),
  on({ keydown: set(ui.tab, "two") }),
  bind({ "aria-expanded": ui.open }),
  bind({ "data-current": ui.tab }),
);
