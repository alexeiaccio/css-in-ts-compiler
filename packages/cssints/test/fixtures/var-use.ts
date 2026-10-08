import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ space: { $type: "dimension", sm: { $value: "8px" } } });

export const a = css.padding(css.var(t.space.sm, "4px"));
export const b = css.padding(css.var(t.space.sm));
export const raw = css.padding("var(--space-sm)");
export const rawFallback = css.margin("var(--space-sm, 4px)");
