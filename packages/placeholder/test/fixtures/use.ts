import { backgroundImage, maskImage } from "cssints" with { type: "cssints" };
import { placeholder } from "@cssints/placeholder" with { type: "cssints" };

export const split = backgroundImage(placeholder("test/fixtures/img/split.png"));
export const sky = backgroundImage(placeholder("test/fixtures/img/sky.jpg", { mode: "gradient" }));
export const thumb = backgroundImage(placeholder("test/fixtures/img/split.png", { mode: "thumbhash" }));
export const fade = maskImage(placeholder("test/fixtures/img/fade.png"));
