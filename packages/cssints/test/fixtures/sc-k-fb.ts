import { scope } from "cssints/plugin";
export const { m } = scope("sc-k-fb", { core: { css: (css) => css.color(css.firstThatWorks("red", "blue")) }, m: { uses: ["core"], chain: {} } }).export();
