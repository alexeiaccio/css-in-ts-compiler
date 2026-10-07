import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  cfail: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    link: { $value: "{cfail.fg}" },
  },
});
css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), { cfail: { bg: "#222222" } });
css.createGlobalTheme(t, ".dim", { cfail: { fg: "#888888", bg: "#999999" } });
css.check.contrast(t.cfail.link, t.cfail.bg, { min: 4.5 });
