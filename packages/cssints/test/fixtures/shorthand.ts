import { css } from "cssints" with { type: "cssints" };

// flex(...parts) and grid(...parts) are the properties; flex() and grid() stay the contexts.
export const a = css.flex("1");
export const b = css.flex(1);
export const c = css.flex("1 1 0");
export const d = css.grid("auto / 1fr 1fr");
export const e = css.flex().direction("column");
export const f = css.cn(css.flex("1"), css.flex().gap(2));
