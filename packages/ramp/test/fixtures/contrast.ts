import { bg, check, color } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts";

// each step at the ratio it was made for, in the default values and in the dark theme
check.contrast(t.blue._1, t.bg, { min: 1.2 });
check.contrast(t.blue._2, t.bg, { min: 1.5 });
check.contrast(t.blue._3, t.bg, { min: 3 });
check.contrast(t.blue._4, t.bg, { min: 4.5 });
check.contrast(t.blue._5, t.bg, { min: 7 });

export const text = [color(t.blue._4), bg(t.bg)];
