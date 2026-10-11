import { reset } from "@cssints/reset" with { type: "cssints" };
import {
  bg,
  colorScheme,
  fontFamily,
  global,
  media,
  scrollPaddingTop,
} from "cssints" with { type: "cssints" };

import { mono, sans, serif } from "./prose.ts" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };

// The reset (border-box, no margins, controls in the page's font), in a layer below every other; then the colour scheme: global
// rules, in the sheet's layer _.k, below every class.
reset();
// the page colour from the first frame, before any component is drawn
global("html", bg(t.color.bg), scrollPaddingTop("calc(var(--layout-header-height) + 16px)"));
global("body", fontFamily(sans));
// the font setting (a font family is no token type): <html data-font> picks the stack
global('[data-font="serif"] body', fontFamily(serif));
global('[data-font="mono"] body', fontFamily(mono));
global(":root", colorScheme("light"));
global(":root.dark", colorScheme("dark"));
global(":root:not(.light)", media("(prefers-color-scheme: dark)")(colorScheme("dark")));
