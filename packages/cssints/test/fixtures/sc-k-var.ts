import { scope } from "cssints/plugin";
export const { m } = scope("sc-k-var", { core: { css: (css) => css.vars({ gap: "1rem" }) }, m: { uses: ["core"], chain: {} } }).export();
