import { createTokens } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

export const t = createTokens({
	color: {
		$type: "color",
		bg: { $value: "#ffffff" },
		fg: { $value: "#111111" },
		edge: { $value: "color-mix(in oklab, {color.bg}, black 10%)" },
	},
	typography: { $type: "dimension", size: { $value: "16px" } },
});

export const appDark = look(t, "dark", "app", {
	color: { bg: "#0b0b0f", fg: "#f3f4f6" },
	typography: { size: "24px" },
});
export const viewerDark = look(t, "dark", "viewer", { color: { bg: "#101018" } });
export const authorMidnight = look(t, '"com.alice.midnight"', "author", { color: { bg: "#0a0a12" } });
export const contained = look(
	t,
	"hero",
	"author",
	{ color: { bg: "#123456" } },
	{ scope: "article.post" },
);
export const refs = look(t, "refs", "app", { color: { fg: "{color.bg}" } });
