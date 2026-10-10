import * as css from "cssints" with { type: "cssints" };
// imports of the style module that only the app's config resolves: an alias and a condition (cssints-qnif)
import { space } from "@space";
import { tone } from "tone";

export const box = css.cn(css.padding(space), css.color(tone));
