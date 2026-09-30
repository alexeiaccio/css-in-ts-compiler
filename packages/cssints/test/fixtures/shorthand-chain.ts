import { css } from "cssints" with { type: "cssints" };

// flex(...parts) is a plain style: it does not chain.
export const a = css.flex("1").gap(2);
