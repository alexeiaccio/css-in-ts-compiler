// What the types of cssints/tui accept and reject (tsgo -p tsconfig.json; `@ts-expect-error` marks what must fail).
import * as css from "cssints/tui";

import { attach, resolve, setTheme, use } from "../../src/opentui.ts";

const t = css.createTokens({ color: { $type: "color", fg: { $value: "#cdd6f4" } } });
css.createGlobalTheme(t, "light", { color: { fg: "#4c4f69" } });

export const ok = css.cn(
  css.color(t.color.fg),
  css.bg("oklch(0.3 0.02 270)"),
  css.border("rounded", "#585b70"),
  css.borderStyle("none"),
  css.p(0, 1),
  css.m("auto", 2),
  css.width("50%"),
  css.height(3),
  css.flexDirection("row"),
  css.fontWeight("lighter"),
  css.textDecoration("underline", "line-through"),
  css.cursor("pointer"),
  css.caretShape("underscore"),
  css.hover(css.bg("#313244")),
  css.focus(css.borderColor("#89b4fa")),
  css.active(css.fontWeight("bold")),
);
const props: { backgroundColor?: string } = resolve(ok, { hover: true });
setTheme("light");
export { attach, props, use };

// @ts-expect-error a CSS length: a terminal counts cells
css.width("10px");
// @ts-expect-error a CSS length again
css.p("1rem");
// @ts-expect-error not a colour
css.color("blu");
// @ts-expect-error a property a terminal cannot do has no member
css.boxShadow("0 0 1px red");
// @ts-expect-error no font size in a terminal
css.fontSize("12px");
// @ts-expect-error a style is no value, and an object literal is no style
css.cn(css.p(1), { color: "red" });
// @ts-expect-error not a terminal border
css.borderStyle("dashed");
// @ts-expect-error not a CSS cursor
css.cursor("hand");
// @ts-expect-error a web style is no terminal style
css.hover("_abc" as string & { readonly __cssints: "style" });
// @ts-expect-error a theme sets tokens that exist
css.createGlobalTheme(t, "dark", { color: { nope: "#000" } });
