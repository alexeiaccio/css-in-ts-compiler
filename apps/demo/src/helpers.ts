import { flex, keyframes, opacity } from "cssints" with { type: "cssints" };

// A helper module, imported with the attribute: each call of `stack` in another file is a build-time call with its
// own argument.
export const stack = (gap: number) => flex().direction("column").gap(gap);

// A keyframes name made in a helper module: the components that use it carry the @keyframes rule into their sheet.
export const pulse = keyframes({ from: opacity(1), "50%": opacity(0.4), to: opacity(1) });
