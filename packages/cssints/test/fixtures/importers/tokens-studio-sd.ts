import * as css from "cssints" with { type: "cssints" };

import tokens from "./tokens-studio-sd.json" with { type: "json" };

export const t = css.createTokens(tokens);
export const card = css.cn(css.p(t.spacing.lg), css.color(t.colors.redLight), css.bg(t.colors.glass), css.fontWeight(t.weight.bold), css.lineHeight(t.lh.body));
