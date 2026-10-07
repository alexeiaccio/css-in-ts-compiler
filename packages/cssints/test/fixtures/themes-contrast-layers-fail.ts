import * as css from "cssints" with { type: "cssints" };

// the app's look sets both colours, the viewer's only the text: the text is read on the app's background
css.layers("app", "viewer");
const t = css.createTokens({
	cly: { $type: "color", fg: { $value: "#000000" }, bg: { $value: "#ffffff" } },
});
css.createGlobalTheme(t, ".look", { cly: { fg: "#eeeeee", bg: "#111111" } }, { layer: "app" });
css.createGlobalTheme(t, ".look", { cly: { fg: "#222222" } }, { layer: "viewer" });
css.check.contrast(t.cly.fg(), t.cly.bg(), { min: 4.5 });
