import * as css from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// The reset and the colour scheme: global rules, in the sheet's layer _.k, below every class.
css.global("*, *::before, *::after", css.boxSizing("border-box"));
// the page colour from the first frame, before any component is drawn
css.global("html", css.bg(t.color.bg));
css.global("body", css.margin("0"));
css.global(":root", css.colorScheme("light"));
css.global(":root.dim, :root.dark", css.colorScheme("dark"));
css.global(":root:not(.light)", css.media("(prefers-color-scheme: dark)")(css.colorScheme("dark")));
// every button takes the page's font family
css.global("button", css.fontFamily("inherit"));
