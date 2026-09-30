import { css } from "cssints" with { type: "cssints" };

// Types catch this too; the twin rejects it at build time.
export const a = css.flex("sideways");
