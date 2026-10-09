import { backgroundImage, color, maskImage } from "cssints";

import { placeholder } from "../../src/index.ts";

export const a = backgroundImage(placeholder("src/hero.jpg"));
export const b = backgroundImage(placeholder("src/hero.jpg", { mode: "gradient" }));
export const c = backgroundImage(placeholder("src/hero.png", { mode: "thumbhash" }));
export const d = maskImage(placeholder("src/fade.png"));

// @ts-expect-error not a mode
export const e1 = placeholder("src/hero.jpg", { mode: "blurhash" });
// @ts-expect-error a path is a string
export const e2 = placeholder(42);
// @ts-expect-error the path is required
export const e3 = placeholder();
// @ts-expect-error no such option
export const e4 = placeholder("src/hero.jpg", { columns: 4 });
// @ts-expect-error an image is not a colour
export const e5 = color(placeholder("src/hero.jpg"));
