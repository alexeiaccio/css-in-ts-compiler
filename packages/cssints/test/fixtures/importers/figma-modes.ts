import * as css from "cssints" with { type: "cssints" };

import dark from "./figma-dark.tokens.json" with { type: "json" };
import light from "./figma-light.tokens.json" with { type: "json" };

export const t = css.createTokens(light);
css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), dark);
export const card = css.cn(css.bg(t.color.surface), css.color(t.color.danger), css.borderColor(t.color.gray._500), css.p(t["padding-default"]));
