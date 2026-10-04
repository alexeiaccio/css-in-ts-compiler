import { createGlobalTheme, createTokens } from "cssints" with { type: "cssints" };
import { look } from "cssints/mise-en-mode" with { type: "cssints" };

export const appDark = look("dark", "app", {
	"--color-bg": "#0b0b0f",
	"--typography-text-primary-size": "1.5rem",
});
export const viewerDark = look("dark", "viewer", { "--color-bg": "#101018" });
export const authorMidnight = look('"com.alice.midnight"', "author", { "--color-bg": "#0a0a12" });
export const contained = look("hero", "author", { "--color-bg": "#123456" }, { scope: "article.post" });

// an app theme in a named top-level layer (the same layer a look uses)
const t = createTokens({ color: { bg: { $value: "#ffffff", $type: "color" } } });
createGlobalTheme(t, '[data-mode="scoped"]', { color: { bg: "#000000" } }, { layer: "app" });

// a theme that overrides one root re-derives the tokens that depend on it, on that scope (not the page's values)
const t2 = createTokens({
	color: {
		canvas: { $value: "#ffffff", $type: "color" },
		edge: {
			$value: "color-mix(in oklab, {color.canvas}, black 10%)",
			$type: "color",
		},
	},
});
createGlobalTheme(t2, '[data-mode="edge"]', { color: { canvas: "#000000" } }, { layer: "app" });
