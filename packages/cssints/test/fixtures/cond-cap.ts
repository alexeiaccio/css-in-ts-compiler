import * as css from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
// Four conditions fit (layers _.a to _.e); this is the fifth.
export const ok = md(md(md(md(css.p(1)))));
export const bad = md(md(md(md(css.hover(css.p(1))))));
