// The four kinds of binding on one element: a source, a comparison, a choice of two literals and a literal.
import { bind, either, equals, state } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ tab: "one", open: false });

export const tab = bind({
  "aria-selected": equals(ui.tab, "one"),
  "aria-controls": "panel-one",
  "data-open": ui.open,
  tabindex: either(equals(ui.tab, "one"), "0", "-1"),
});
