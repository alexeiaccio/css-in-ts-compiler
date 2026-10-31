import { emit, on } from "@cssints/reactive" with { type: "cssints" };

export const form = on({ submit: emit("Save") });
