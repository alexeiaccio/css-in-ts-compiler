import { scope } from "cssints/plugin";
export const { m } = scope("sc-pair-apart", { "#view": { css: (css) => css.animationTimeline("view()") }, "#zap": { css: (css) => css.color("red") }, m: { uses: ["zap", "view"], chain: {} } }).export();
