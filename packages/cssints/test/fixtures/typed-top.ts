import { css, CSS } from "cssints" with { type: "cssints" };

import { accent } from "./tokens-typed";

// Top-level value constructors are sites too: the client gets their CSS text, not the objects.
const gap = CSS.rem(1);
export const a = css.p(gap);
export const b = css.border("1px solid", accent);
export const g = gap;
