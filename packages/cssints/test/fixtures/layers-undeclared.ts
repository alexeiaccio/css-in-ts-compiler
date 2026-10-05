import { createGlobalTheme, createTokens } from "cssints" with { type: "cssints" };

const t = createTokens({ lyu: { $type: "color", bg: { $value: "#ffffff" } } });
createGlobalTheme(t, ".x", { lyu: { bg: "#000000" } }, { layer: "nope" });
