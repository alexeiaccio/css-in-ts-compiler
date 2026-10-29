import { appear } from "@cssints/reveal" with { type: "cssints" };

// @ts-expect-error an exit preset
export const a = appear().preset("fade-out");
