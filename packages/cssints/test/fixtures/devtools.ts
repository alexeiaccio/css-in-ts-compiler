import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const ink = css.token.color("#111827", "ink");

export const card = css.cn(css.group(), frame().padding(2), css.color(ink));
export const link = css.cn(css.hover(css.color("red")), md(css.color("blue")));
export const row = css.cn(css.p(2), css.within(css.hover)(css.bg("#eee")));
