import * as css from "cssints/clay" with { type: "cssints" };

// no options: the default radius
export const plain = css.backdrop();
// a menu's glass
export const menu = css.backdrop({ blur: 10 });
// a string of pixels is pixels, as the other lengths
export const panel = css.backdrop({ blur: "18px" });
// a state's backdrop is laid over the base: the blur changes
export const card = css.cn(css.backdrop({ blur: 6 }), css.hover(css.backdrop({ blur: 16 })));
// a backdrop beside a declaration: the layout and the colour are printed, the backdrop is not
export const floating = css.cn(
  css.width(150),
  css.bg("rgb(23 27 32 / 0.72)"),
  css.borderRadius(10),
  css.backdrop({ blur: 10 }),
);
