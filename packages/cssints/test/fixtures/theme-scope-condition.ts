import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

const t = createTokens({ lsc: { $type: "color", bg: { $value: "#ffffff" } } });
createGlobalTheme(t, media("(width > 40rem)"), { lsc: { bg: "#000000" } }, { scope: "main" });
