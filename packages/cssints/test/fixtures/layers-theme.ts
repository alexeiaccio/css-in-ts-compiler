import { createGlobalTheme, createTokens, layers } from "cssints" with { type: "cssints" };

layers("app", "author", "viewer");
const t = createTokens({ lay: { $type: "color", bg: { $value: "#ffffff" } } });
createGlobalTheme(t, '[data-mode="dark"]', { lay: { bg: "#000000" } }, { layer: "viewer" });
createGlobalTheme(
	t,
	'[data-mode="hero"]',
	{ lay: { bg: "#123456" } },
	{ layer: "author", scope: "article.post" },
);
