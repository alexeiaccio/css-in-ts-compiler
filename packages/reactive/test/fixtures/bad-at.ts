import { set, state } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ tab: "one" });

export const b = set(ui.tab, "@value");
