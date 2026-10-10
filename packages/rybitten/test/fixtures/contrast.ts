import { bg, check, color } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts";

// the ink of a cube on its paper, in the default values and in the dark theme (where the paper and the ink swap)
check.contrast(t.paper._3, t.paper._1, { min: 12 });
check.contrast(t.paper._1, t.paper._3, { min: 12 });

export const text = [color(t.hue._3), bg(t.paper._1), color(t.brand)];
