import { scope } from "cssints/plugin";
export const { m } = scope("sc-k-own", { core: { css: (css) => css.nest(":hover")(css.color("red")) }, m: { uses: ["core"], chain: {} } }).export();
