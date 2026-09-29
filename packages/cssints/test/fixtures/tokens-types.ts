import * as css from "cssints" with { type: "cssints" };

export const level = css.token.integer("3", "types-level");
export const spin = css.token.angle("0.25turn", "types-spin");
export const dur = css.token.time("200ms", "types-dur");
export const name = css.token.customIdent("slide", "types-name");
export const dpr = css.token.resolution("2dppx", "types-dpr");
export const src = css.token.url("url(/a.png)", "types-src");
export const img = css.token.image("linear-gradient(red, blue)", "types-img");
export const pic = css.token.image("url(/a.png)", "types-pic");

// Each token where its type goes: the recognizer checks a literal of the type in its place.
export const used = css.cn(
  css.zIndex(level),
  css.opacity(level),
  css.rotate(spin),
  css.animation(dur, name),
  css.imageResolution(dpr),
  css.backgroundImage(src),
  css.listStyleImage(img),
  css.borderImageSource(pic),
  css.markerStart(src),
);
