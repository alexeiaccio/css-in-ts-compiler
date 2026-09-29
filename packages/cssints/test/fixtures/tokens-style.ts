import * as css from "cssints" with { type: "cssints" };

import { blue } from "./tokens-named.ts" with { type: "cssints" };

// style(...) takes css values and token.set() results; the custom property goes first.
export const themed = css.style(css.color(blue), css.token.set(blue, "red"));
export const only = css.token.set(blue, "green");
export const box = css.style(css.cn(css.paddingLeft("1rem"), css.backgroundColor("#eee")), css.p(4));
