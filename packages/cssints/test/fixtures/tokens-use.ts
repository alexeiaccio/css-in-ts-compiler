import * as css from "cssints" with { type: "cssints" };

import { blue } from "./tokens-named.ts" with { type: "cssints" };

// A token of another module: its @property comes with this module too.
export const link = css.cn(css.color(blue), css.textDecorationColor(blue));
