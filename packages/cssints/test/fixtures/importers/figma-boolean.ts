import * as css from "cssints" with { type: "cssints" };

import tokens from "./figma-boolean.tokens.json" with { type: "json" };

export const t = css.createTokens(tokens);
