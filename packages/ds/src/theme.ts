import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import { darkTokens, lightTokens } from "./tokens.ts";

const t = createTokens(lightTokens);

createGlobalTheme(t, media("(prefers-color-scheme: dark)"), darkTokens);

check.contrast(t.color.text, t.color.page, { min: 7 });
check.contrast(t.color.text, t.color.surface, { min: 7 });
check.contrast(t.color.muted, t.color.page, { min: 4.5 });
check.contrast(t.color.onAccent, t.color.accent, { min: 4.5 });
check.contrast(t.color.danger, t.color.surface, { min: 4.5 });
check.contrast(t.color.focusRing, t.color.page, { min: 3 });

/**
 * The theme every component in this package is written against: the token data compiled by `cssints`, the dark mode as the
 * system preference, and the contrast pairs a reader meets on every page checked at build time — 7:1 for body text, 4.5:1
 * for the rest, 3:1 for the focus ring.
 */
export { t };
