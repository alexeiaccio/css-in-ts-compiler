import { bind, state } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ tab: "one" });

export const tab = bind({ "aria-controls": "panel one" });
