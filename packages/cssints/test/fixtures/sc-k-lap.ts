import { scope } from "cssints/plugin";
export const { m } = scope("sc-k-lap", { core: { css: (css) => [css.marginLeft("1px"), css.marginInlineStart("1px")] }, m: { uses: ["core"], chain: {} } }).export();
