import * as css from "cssints" with { type: "cssints" };

import { t } from "./themes-theme.ts" with { type: "cssints" };

// Only reads tokens of another module: their themes come with it, when they set a token it reads.
export const box = css.cn(css.bg(t.th.bg), css.gap(t.gap.md));
