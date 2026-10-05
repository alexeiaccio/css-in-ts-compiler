import * as css from "cssints";
import { ring, tokens } from "./ring.ts";

export const a = ring().width("3px").color("red");
export const b = css.cn(ring().color("#111"), css.hover(ring().width("4px")));
export const c = ring();
// a token is a value of its type
const brand = css.createTokens({ color: { accent: { $type: "color", $value: "#db2777" } } });
export const d = ring().color(brand.color.accent);

// the plugin's tokens are the user's to theme and to check
css.createGlobalTheme(tokens, ".thick", { width: "4px" });
css.check.contrast(tokens.color, brand.color.accent, { min: 1.5 });

// @ts-expect-error not a length
export const e = ring().width("red");
// @ts-expect-error a setter is used once
export const f = ring().width("1px").width("2px");
// @ts-expect-error a ring chains its own setters
export const g = ring().color("red").padding(1);
// @ts-expect-error a theme sets tokens of the plugin, checked against their types
css.createGlobalTheme(tokens, ".bad", { width: "red" });
