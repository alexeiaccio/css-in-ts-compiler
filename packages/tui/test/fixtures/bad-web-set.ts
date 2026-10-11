import * as css from "cssints/tui" with { type: "cssints" };

import { w } from "./web.ts" with { type: "cssints" };

// web tokens given to the terminal createGlobalTheme
css.createGlobalTheme(w, "light", { color: { bg: "#eff1f5" } });
