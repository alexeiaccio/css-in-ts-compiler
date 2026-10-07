import * as css from "cssints" with { type: "cssints" };

// the viewer's text colour alone on the default background is white on white; on the app's look it is readable
css.layers("app", "viewer");
const t = css.createTokens({
	clp: { $type: "color", fg: { $value: "#000000" }, bg: { $value: "#ffffff" } },
});
css.createGlobalTheme(t, ".look", { clp: { bg: "#111111" } }, { layer: "app" });
css.createGlobalTheme(t, ".look", { clp: { fg: "#ffffff" } }, { layer: "viewer" });
css.check.contrast(t.clp.fg, t.clp.bg, { min: 4.5 });
