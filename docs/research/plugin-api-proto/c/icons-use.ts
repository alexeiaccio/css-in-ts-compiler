import * as css from "cssints";
import { icons } from "./icons.ts";

interface Mdi {
  icons: { home: unknown; "home-outline": unknown };
  aliases: { house: unknown };
}
const mdi = icons<Mdi>({ provider: "iconify-json", collection: "mdi" });
export const a = css.cn(mdi("home"), css.color("red"));
export const b = mdi("house");
// @ts-expect-error not an icon of the collection
export const c = mdi("hom");
// @ts-expect-error one name
export const d = mdi("home", "home-outline");

const brand = icons({ provider: "fs", dir: "src/icons" });
export const e = brand("logo");
// @ts-expect-error a name, not a number
export const f = brand(1);
// @ts-expect-error a provider that does not exist
icons({ provider: "iconify", collection: "mdi" });
