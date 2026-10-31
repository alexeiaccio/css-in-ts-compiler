import { persist, state } from "@cssints/reactive" with { type: "cssints" };

export const ui = state({ open: persist(false, "demo open") });
