import * as css from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// terminal tokens given to the web createGlobalTheme
css.createGlobalTheme(t, ".light", { color: { bg: "#eff1f5" } });
