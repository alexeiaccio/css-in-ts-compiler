import { emit } from "@cssints/reactive" with { type: "cssints" };

// emit() is an action: it belongs inside on(), not in a style's place
export const hand = emit("save");
