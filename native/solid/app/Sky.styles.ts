// The Sky page's palette, in a module of its own so that the page and the settings screen's styles are the same tokens:
// `Sky.tsx` draws the feed, the bar and the thread with them, `Settings.tsx` the settings screen and the feed card's Large
// text. A styles module by name (`.styles.ts`), which is what `solid/plugin.ts` compiles with the cssints plugin: the
// tokens are evaluated when the module loads, so a page cannot build one from a loop variable.
import * as css from "cssints/clay" with { type: "cssints" };

// the sky palette: the page, the card one tonal step above it (its top; the gradient's deep end is a step below), the
// hover step, the muted step and the accent blue; the ring is the same blue the other pages use.
export const t = css.createTokens({
  color: {
    $type: "color",
    page: { $value: "rgb(16 19 22)" },
    panel: { $value: "rgb(27 32 38)" },
    panelDeep: { $value: "rgb(21 25 30)" },
    hover: { $value: "rgb(34 40 49)" },
    hoverDeep: { $value: "rgb(28 33 40)" },
    ink: { $value: "rgb(230 233 236)" },
    muted: { $value: "rgb(139 152 165)" },
    accent: { $value: "rgb(59 156 240)" },
    ring: { $value: "rgb(92 176 255)" },
  },
});
css.createGlobalTheme(t, "light", {
  color: {
    page: "rgb(243 245 247)",
    panel: "rgb(255 255 255)",
    panelDeep: "rgb(240 243 246)",
    hover: "rgb(232 238 244)",
    hoverDeep: "rgb(222 229 236)",
    ink: "rgb(15 20 25)",
    muted: "rgb(86 99 111)",
    accent: "rgb(17 112 207)",
    ring: "rgb(11 98 189)",
  },
});
export const font = css.fonts("Roboto");
