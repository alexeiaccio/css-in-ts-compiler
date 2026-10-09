import * as css from "cssints" with { type: "cssints" };

import tokens from "./tokens-studio-modify.json" with { type: "json" };

export const t = css.createTokens(tokens);
