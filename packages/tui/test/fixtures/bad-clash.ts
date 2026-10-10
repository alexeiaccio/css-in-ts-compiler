import * as css from "cssints/tui" with { type: "cssints" };

// theme.ts's terminal token --color-bg with another value: one name, one terminal token
export const other = css.createTokens({ color: { $type: "color", bg: { $value: "#000000" } } });
