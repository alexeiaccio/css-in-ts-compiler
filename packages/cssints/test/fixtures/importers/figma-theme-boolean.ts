import * as css from "cssints" with { type: "cssints" };

import light from "./figma-light.tokens.json" with { type: "json" };

export const t = css.createTokens(light);
css.createGlobalTheme(t, ".dark", {
  color: { red: { $type: "color", $value: "#f00", $extensions: { "com.figma.type": "boolean" } } },
});
