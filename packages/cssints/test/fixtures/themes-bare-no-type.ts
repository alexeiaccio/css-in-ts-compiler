import * as css from "cssints" with { type: "cssints" };

// A value with no $type in scope: createTokens does not guess a type from a value.
export const t = css.createTokens({ color: { bg: "#ffffff" } });
