import { scope } from "cssints/plugin";
export const { m } = scope("sc-k-list", { core: { css: (css) => css.nest("& > a, .x &")(css.color("red")) }, m: { uses: ["core"], chain: {} } }).export();
