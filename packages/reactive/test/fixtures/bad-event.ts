import { on, state, toggle } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ open: false });
export const button = on({ dblclick: toggle(ui.open) });
