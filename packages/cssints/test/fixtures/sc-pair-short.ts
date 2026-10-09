import { scope } from "cssints/plugin";
export const { m } = scope("sc-pair-short", { "#view": { css: (css) => css.animationTimeline("view()") }, "#zap": { css: (css) => css.animation("1s both") }, m: { uses: ["zap", "view"], chain: {} } }).export();
