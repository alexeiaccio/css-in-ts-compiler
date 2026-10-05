import * as css from "cssints";
import { look } from "./mise-en-mode.ts";
import { ring } from "./ring.ts";
import { icons } from "./icons.ts";
const t = css.createTokens({ color: { $type: "color", bg: { $value: "#fff" } } });
export const p1: number = look;
export const p2: number = ring;
export const p3: number = ring().width("1px");
export const p4: number = icons({ provider: "fs", dir: "x" });
// the message on the bad argument, as the user reads it
look(t, "dark", "app", { color: { bg: "1px" } });
look(t, "dark", "app", { color: { nope: "red" } });
ring().width("red");
ring().width("1px").width("2px");
icons<{ icons: { home: 1 } }>({ provider: "iconify-json", collection: "m" })("hom");
