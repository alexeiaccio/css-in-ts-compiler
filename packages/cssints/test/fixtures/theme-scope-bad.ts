import { createGlobalTheme, createTokens } from "cssints" with { type: "cssints" };

const t = createTokens({ lsb: { $type: "color", bg: { $value: "#ffffff" } } });
createGlobalTheme(t, ".x", { lsb: { bg: "#000000" } }, { scope: "a {" });
