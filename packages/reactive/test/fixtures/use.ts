// The model of README.md: two states on one owner, a write on a click, DOM output, and two descendants' conditions.
import { cn, display, p } from "cssints" with { type: "cssints" };
import { bind, inside, on, state, toggle, when } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ open: false, tab: "one" });

export const card = cn(ui.owner, p(4));
export const button = cn(
  on({ click: toggle(ui.open) }),
  bind({ "aria-expanded": ui.open, "data-current": ui.tab }),
);
export const panel = inside(ui.open)(display("block"));
export const tabPanel = inside(ui.tab, "two")(display("block"));
export const own = when(ui.open)(display("block"));
