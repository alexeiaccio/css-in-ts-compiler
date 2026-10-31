import { bind, state } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ open: false });
export const button = bind({ "aria expanded": ui.open });
