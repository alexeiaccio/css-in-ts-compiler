import { _cv } from "cssints";
import { bg, cn, color, cv, hover, p } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

export { t };

export const card = cn(p(4), bg(t.color.brand), color(t.color.ink));

export const button = _cv(
  cv({
    base: cn(p(2), hover(bg("#2563eb"))),
    variants: { size: { lg: p(6) } },
    defaultVariants: { size: "lg" },
  }),
);
