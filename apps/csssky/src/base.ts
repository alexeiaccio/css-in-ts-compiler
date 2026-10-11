import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, colorScheme, global, media } from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// The reset (border-box, no margins, controls in the page's font), in a layer below every other; then the colour scheme: global
// rules, in the sheet's layer _.k, below every class.
reset();
// the page colour from the first frame, before any component is drawn
global("html", bg(t.color.bg));
global(":root", colorScheme("light"));
global(":root.dim, :root.dark", colorScheme("dark"));
global(":root:not(.light)", media("(prefers-color-scheme: dark)")(colorScheme("dark")));
