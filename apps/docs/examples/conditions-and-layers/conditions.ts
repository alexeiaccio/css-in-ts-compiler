import * as css from "cssints" with { type: "cssints" };

// A condition is a function that wraps styles. Wrappers nest, and each one counts as a layer.
export const [tablet, wide] = css.media("(width >= 40rem)", "(width >= 60rem)");
export const dark = css.media("(prefers-color-scheme: dark)");
export const narrow = css.container("shelf (width < 30rem)");
export const hasGrid = css.supports("(display: grid)");
