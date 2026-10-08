// Kernels written as styles whose declarations a target lacks (corner-shape: Chrome 120 and Firefox 128; animation-range:
// Firefox 128): a runtime that polyfills the feature covers the warning, as it covers `requires`; without one, the
// warning names the value as the sheet prints it.
import { scope } from "cssints/plugin";

export const { covered, bare } = scope("sw", {
  "#corner": { css: (css) => [css.borderRadius("var(--_r)"), css.cornerShape("squircle")] },
  "#range": { css: (css) => css.animationRange("var(--_g)") },
  "#mask": { polyfills: ["css.properties.corner-shape"], css: "&{--_m:1}" },
  covered: { args: [], uses: ["corner", "mask"] },
  bare: { args: [], uses: ["range"] },
})
  .build({ covered: () => ({}), bare: () => ({}) })
  .export();
