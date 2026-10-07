import * as css from "cssints" with { type: "cssints" };

import tokens from "./tokens.json" with { type: "json" };

export const t = css.createTokens(tokens);
export const card = css.cn(css.bg(t.brand.bg()), css.color(t.brand.hover()), css.p(t.gap.md()));
