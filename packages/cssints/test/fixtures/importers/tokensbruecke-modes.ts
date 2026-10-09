import * as css from "cssints" with { type: "cssints" };

import tokens from "./tokensbruecke-modes.tokens.json" with { type: "json" };

export const t = css.createTokens(tokens);
