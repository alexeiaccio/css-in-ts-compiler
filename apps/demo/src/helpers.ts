import { flex } from "cssints" with { type: "cssints" };

// A helper module, imported with the attribute: each call of `stack` in another file is a build-time call with its
// own argument.
export const stack = (gap: number) => flex().direction("column").gap(gap);
