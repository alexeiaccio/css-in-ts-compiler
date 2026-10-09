import { scope } from "cssints/plugin";
export const { m } = scope("sc-pair-same", { "#view": { css: (css) => css.hover(css.color("red")) }, "#zap": { css: (css) => [css.display("flex"), css.color("blue")] }, m: { uses: ["zap", "view"], chain: {} } }).export();
