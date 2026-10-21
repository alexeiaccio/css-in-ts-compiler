import * as css from "cssints/clay" with { type: "cssints" };

// an image at its own size: the box is 32x32, imageData the path the renderer loads
export const glyph = css.image("examples/sensors/glyph.png", { width: 32, height: 32 });
// contain: Clay's aspectRatio, so a box that grows keeps the image's proportions
export const logo = css.cn(
  css.image("assets/logo.png", { width: 64, height: 32, fit: "contain" }),
  css.width("stretch"),
);
// a path with a quote and a backslash, printed as a C string
export const odd = css.image('a"b\\c.png', { width: 1, height: 2 });
// a later image that fills clears an earlier one's ratio (Clay's 0: no aspectRatio in the literal)
export const cleared = css.cn(
  css.image("a.png", { width: 64, height: 32, fit: "contain" }),
  css.image("b.png", { width: 8, height: 8 }),
);
