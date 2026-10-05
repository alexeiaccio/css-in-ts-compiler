import { cn } from "cssints";
import type { Style } from "cssints/plugin";
import { icons } from "./icons.ts";

const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({ provider: "iconify-json", collection: "mdi" });
export const home: Style = mdi("home");
export const outline = cn(mdi("home-outline"), mdi("3d-rotation"));
// @ts-expect-error not an icon of mdi
export const typo = mdi("hom");
// @ts-expect-error a name, not a number
export const num = mdi(3);
// @ts-expect-error one name
export const two = mdi("home", "home-outline");
const loose = icons({ provider: "iconify-json", collection: "mdi" });
export const anything = loose("whatever");
const brand = icons({ provider: "fs", dir: "src/icons" });
export const logo = brand("logo");
// @ts-expect-error a name, not a number
export const nope = brand(1);
// @ts-expect-error a provider that does not exist
icons({ provider: "iconify", collection: "mdi" });
// @ts-expect-error fs takes a directory
icons({ provider: "fs", collection: "mdi" });
