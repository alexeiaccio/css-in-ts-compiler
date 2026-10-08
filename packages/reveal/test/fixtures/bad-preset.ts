import { reveal } from "@cssints/reveal" with { type: "cssints" };

// @ts-expect-error an exit preset
export const a = reveal().preset("fade-out");
