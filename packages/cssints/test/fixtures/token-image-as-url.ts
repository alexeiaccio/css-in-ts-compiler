import * as css from "cssints" with { type: "cssints" };

export const img = css.token.image("url(/a.png)", "image-as-url");
// an image where only a <url> goes
export const bad = css.markerStart(img);
