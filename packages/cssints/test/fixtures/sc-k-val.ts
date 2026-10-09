import { scope } from "cssints/plugin";
export const { m } = scope("sc-k-val", { core: { css: (css) => css.hover(css.color("1px")) }, m: { uses: ["core"], chain: {} } }).export();
