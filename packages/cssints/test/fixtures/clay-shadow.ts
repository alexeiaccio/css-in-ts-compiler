import * as css from "cssints/clay" with { type: "cssints" };

// no options: the whole default shadow
export const plain = css.shadow();
// a panel's: the element's own box, 12px down, its edge 24px wide, black at 45%
export const panel = css.shadow({ x: 0, y: 12, blur: 24, color: "rgb(0 0 0 / 0.45)" });
// a partial shadow takes its own defaults; a state's overlay merges field by field over the base
export const card = css.cn(
  css.shadow({ x: 2, y: 8, blur: 16, color: "rgb(0 0 0 / 0.5)" }),
  css.hover(css.shadow({ blur: 20 })),
);
// two shadows in one cn() merge field by field too: the later y, the earlier blur
export const replaced = css.cn(css.shadow({ blur: 4 }), css.shadow({ y: -3 }));
// a shadow beside a declaration: the layout is printed, the shadow is not
export const floating = css.cn(
  css.width(280),
  css.bg("rgb(36 40 52)"),
  css.borderRadius(12),
  css.shadow({ y: 12, blur: 24 }),
);
