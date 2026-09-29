import { css } from "cssints" with { type: "cssints" };

import { space } from "./tokens";

// Types cannot see these values; the twin rejects them at build time.
export const a = css.p(-space.md);
export const b = css.border(`1px ${["solud"][0]}`);
