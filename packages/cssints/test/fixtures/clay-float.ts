import * as css from "cssints/clay" with { type: "cssints" };

// a menu under its button: the defaults, attached to the element it is a child of
export const plain = css.float();
// every option, attached to an element by its id
export const menu = css.cn(
  css.width(160),
  css.bg("#242834"),
  css.float({
    attach: { element: "left top", parent: "left bottom" },
    parent: "Units",
    offset: { x: 4, y: "-2px" },
    expand: { width: 2, height: 3 },
    zIndex: 10,
    capture: false,
    clip: "parent",
  }),
);
// a dialog centred on the screen
export const dialog = css.cn(
  css.float({ root: true, attach: { element: "center center", parent: "center center" }, zIndex: 100 }),
  css.p(16),
);
// two floats merge like the other members: the second sets one field and keeps the first's parent
export const merged = css.cn(css.float({ parent: "Units", zIndex: 1 }), css.float({ offset: { y: 8 } }));
// a state may float: the hover is a declaration of its own
export const tip = css.cn(css.p(4), css.hover(css.float({ attach: { parent: "center top" } })));
