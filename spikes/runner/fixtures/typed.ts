import { css, CSS } from "cssints";

import { accent } from "./tokens-typed";

export const a = css.border("1px solid", accent);
export const b = css.p(CSS.rem(1), CSS.rem(2));
