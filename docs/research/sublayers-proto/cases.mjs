// The cases. An item is one css.* call: `m` the member, `v` its value, `w` the conditions around it (outermost first;
// `md` is (width >= 40rem), the others are pseudo-class wrappers). Each case runs in two orders: the items as written
// (`ab`) and reversed (`ba`), as `cn(...items)`; a case with `modules` puts every item in a module of its own and the
// element gets the classes of all of them.
//
// kind: what the author's intent is, which says which orders must pass.
//   contain  one property contains another (a longhand of a shorthand): the longhand wins, whatever the order
//   later    the properties overlap without containing each other, or are the same property: the later one wins,
//            so the order that puts the other one last must fail unless the sheet knows the argument order
//   layer    a condition is involved: conditional rules outrank unconditional ones (the layer is the number of
//            conditions); inside that, as above
//   cond     two different conditions in one layer: oracle A says the containment rule, oracle B the order the sheet gives
//            conditions (narrow breakpoint first, then pseudo-classes by rank); both are checked, see run.mjs
export const cases = [
  // Control: the same property twice.
  {
    id: "s1",
    kind: "later",
    title: "color twice",
    items: [
      { m: "color", v: "red" },
      { m: "color", v: "blue" },
    ],
  },
  {
    id: "s2",
    kind: "later",
    title: "hover color twice",
    items: [
      { m: "color", v: "red", w: ["hover"] },
      { m: "color", v: "blue", w: ["hover"] },
    ],
  },
  {
    id: "s3",
    kind: "later",
    title: "color twice, two modules",
    modules: true,
    items: [
      { m: "color", v: "red" },
      { m: "color", v: "blue" },
    ],
  },

  // border
  {
    id: "b1",
    kind: "later",
    title: "border / border-inline",
    items: [
      { m: "border", v: "1px solid red" },
      { m: "borderInline", v: "3px dashed blue" },
    ],
  },
  {
    id: "b2",
    kind: "later",
    title: "border-color / border-inline",
    items: [
      { m: "borderColor", v: "green" },
      { m: "borderInline", v: "3px dashed blue" },
    ],
  },
  {
    id: "b3",
    kind: "later",
    title: "border-color / border-inline-start-color",
    items: [
      { m: "borderColor", v: "green" },
      { m: "borderInlineStartColor", v: "orange" },
    ],
  },
  {
    id: "b4",
    kind: "contain",
    title: "border-inline / border-inline-start-color",
    items: [
      { m: "borderInline", v: "3px dashed blue" },
      { m: "borderInlineStartColor", v: "orange" },
    ],
  },
  {
    id: "b5",
    kind: "contain",
    title: "border-inline / border-inline-start",
    items: [
      { m: "borderInline", v: "1px solid red" },
      { m: "borderInlineStart", v: "3px dashed blue" },
    ],
  },
  {
    id: "b6",
    kind: "contain",
    title: "border-inline-color / border-inline-start-color",
    items: [
      { m: "borderInlineColor", v: "green" },
      { m: "borderInlineStartColor", v: "orange" },
    ],
  },
  {
    id: "b7",
    kind: "contain",
    title: "border / border-color",
    items: [
      { m: "border", v: "1px solid red" },
      { m: "borderColor", v: "green" },
    ],
  },
  {
    id: "b8",
    kind: "later",
    title: "border / border-inline-start-color",
    items: [
      { m: "border", v: "1px solid red" },
      { m: "borderInlineStartColor", v: "orange" },
    ],
  },
  {
    id: "b9",
    kind: "contain",
    title: "border-block / border-block-start",
    items: [
      { m: "borderBlock", v: "1px solid red" },
      { m: "borderBlockStart", v: "3px dashed blue" },
    ],
  },
  {
    id: "b10",
    kind: "contain",
    title: "border-block / border-block-end",
    items: [
      { m: "borderBlock", v: "1px solid red" },
      { m: "borderBlockEnd", v: "3px dashed blue" },
    ],
  },
  {
    id: "b11",
    kind: "later",
    title: "border, border-inline, border-color, border-inline-start-color",
    items: [
      { m: "border", v: "1px solid red" },
      { m: "borderInline", v: "3px dashed blue" },
      { m: "borderColor", v: "green" },
      { m: "borderInlineStartColor", v: "orange" },
    ],
  },

  {
    id: "b12",
    kind: "later",
    title: "border-top / border-color",
    items: [
      { m: "borderTop", v: "3px dashed blue" },
      { m: "borderColor", v: "green" },
    ],
  },
  {
    id: "w1",
    kind: "later",
    title: "white-space / text-wrap",
    items: [
      { m: "whiteSpace", v: "pre" },
      { m: "textWrap", v: "balance" },
    ],
  },

  // inset
  {
    id: "i1",
    kind: "later",
    title: "inset / inset-block",
    items: [
      { m: "inset", v: "1px" },
      { m: "insetBlock", v: "2px" },
    ],
  },
  {
    id: "i2",
    kind: "contain",
    title: "inset / top",
    items: [
      { m: "inset", v: "1px" },
      { m: "top", v: "5px" },
    ],
  },
  {
    id: "i3",
    kind: "later",
    title: "inset-block / top",
    items: [
      { m: "insetBlock", v: "2px" },
      { m: "top", v: "5px" },
    ],
  },
  {
    id: "i4",
    kind: "contain",
    title: "inset-block / inset-block-start",
    items: [
      { m: "insetBlock", v: "2px" },
      { m: "insetBlockStart", v: "7px" },
    ],
  },
  {
    id: "i5",
    kind: "later",
    title: "inset, inset-block, top",
    items: [
      { m: "inset", v: "1px" },
      { m: "insetBlock", v: "2px" },
      { m: "top", v: "5px" },
    ],
  },

  // margin
  {
    id: "m1",
    kind: "later",
    title: "margin / margin-inline",
    items: [
      { m: "m", v: "1px" },
      { m: "marginInline", v: "2px" },
    ],
  },
  {
    id: "m2",
    kind: "later",
    title: "margin-inline / margin-left",
    items: [
      { m: "marginInline", v: "2px" },
      { m: "ml", v: "3px" },
    ],
  },
  {
    id: "m3",
    kind: "contain",
    title: "margin / margin-left",
    items: [
      { m: "m", v: "1px" },
      { m: "ml", v: "3px" },
    ],
  },
  {
    id: "m4",
    kind: "later",
    title: "margin / margin-inline-start",
    items: [
      { m: "m", v: "1px" },
      { m: "marginInlineStart", v: "4px" },
    ],
  },
  {
    id: "m5",
    kind: "contain",
    title: "margin-inline / margin-inline-start",
    items: [
      { m: "marginInline", v: "2px" },
      { m: "marginInlineStart", v: "4px" },
    ],
  },
  {
    id: "m6",
    kind: "later",
    title: "margin-left / margin-inline-start",
    items: [
      { m: "ml", v: "3px" },
      { m: "marginInlineStart", v: "4px" },
    ],
  },
  {
    id: "m7",
    kind: "later",
    title: "margin, margin-inline, margin-left",
    items: [
      { m: "m", v: "1px" },
      { m: "marginInline", v: "2px" },
      { m: "ml", v: "3px" },
    ],
  },

  // grid
  {
    id: "g1",
    kind: "contain",
    title: "grid-area / grid-row",
    items: [
      { m: "gridArea", v: "1 / 2 / 3 / 4" },
      { m: "gridRow", v: "5 / 6" },
    ],
  },
  {
    id: "g2",
    kind: "contain",
    title: "grid-row / grid-row-start",
    items: [
      { m: "gridRow", v: "5 / 6" },
      { m: "gridRowStart", v: "7" },
    ],
  },
  {
    id: "g3",
    kind: "contain",
    title: "grid-area / grid-row-start",
    items: [
      { m: "gridArea", v: "1 / 2 / 3 / 4" },
      { m: "gridRowStart", v: "7" },
    ],
  },
  {
    id: "g4",
    kind: "contain",
    title: "grid-area, grid-row, grid-row-start",
    items: [
      { m: "gridArea", v: "1 / 2 / 3 / 4" },
      { m: "gridRow", v: "5 / 6" },
      { m: "gridRowStart", v: "7" },
    ],
  },
  {
    id: "g5",
    kind: "contain",
    title: "grid / grid-template",
    items: [
      { m: "grid", v: "auto-flow / 100px 200px" },
      { m: "gridTemplate", v: "none / 10px 20px" },
    ],
  },

  // font
  {
    id: "f1",
    kind: "contain",
    title: "font / font-variant",
    items: [
      { m: "font", v: "italic 700 16px serif" },
      { m: "fontVariant", v: "small-caps" },
    ],
  },
  {
    id: "f2",
    kind: "contain",
    title: "font-variant / font-variant-caps",
    items: [
      { m: "fontVariant", v: "small-caps" },
      { m: "fontVariantCaps", v: "all-small-caps" },
    ],
  },
  {
    id: "f3",
    kind: "contain",
    title: "font / font-variant-caps",
    items: [
      { m: "font", v: "italic 700 16px serif" },
      { m: "fontVariantCaps", v: "all-small-caps" },
    ],
  },
  {
    id: "f4",
    kind: "contain",
    title: "font, font-variant, font-variant-caps",
    items: [
      { m: "font", v: "italic 700 16px serif" },
      { m: "fontVariant", v: "small-caps" },
      { m: "fontVariantCaps", v: "all-small-caps" },
    ],
  },

  // mask
  {
    id: "k1",
    kind: "later",
    title: "mask / mask-border",
    items: [
      { m: "mask", v: "linear-gradient(red, blue) no-repeat" },
      { m: "maskBorder", v: "linear-gradient(red, blue) 30 / 10px" },
    ],
  },
  {
    id: "k2",
    kind: "contain",
    title: "mask / mask-image",
    items: [
      { m: "mask", v: "linear-gradient(red, blue) no-repeat" },
      { m: "maskImage", v: "linear-gradient(green, blue)" },
    ],
  },

  // text-decoration
  {
    id: "t1",
    kind: "contain",
    title: "text-decoration / text-decoration-line",
    items: [
      { m: "textDecoration", v: "underline dotted red" },
      { m: "textDecorationLine", v: "line-through" },
    ],
  },
  {
    id: "t2",
    kind: "contain",
    title: "text-decoration / -line / -color",
    items: [
      { m: "textDecoration", v: "underline dotted red" },
      { m: "textDecorationLine", v: "line-through" },
      { m: "textDecorationColor", v: "blue" },
    ],
  },

  // alignment, overflow
  {
    id: "p1",
    kind: "contain",
    title: "place-items / align-items",
    items: [
      { m: "placeItems", v: "start end" },
      { m: "alignItems", v: "center" },
    ],
  },
  {
    id: "p2",
    kind: "contain",
    title: "place-items / justify-items",
    items: [
      { m: "placeItems", v: "start end" },
      { m: "justifyItems", v: "center" },
    ],
  },
  {
    id: "o1",
    kind: "contain",
    title: "overflow / overflow-x",
    items: [
      { m: "overflow", v: "hidden" },
      { m: "overflowX", v: "scroll" },
    ],
  },
  {
    id: "o2",
    kind: "contain",
    title: "overflow / overflow-y",
    items: [
      { m: "overflow", v: "hidden" },
      { m: "overflowY", v: "scroll" },
    ],
  },

  // all
  {
    id: "a1",
    kind: "contain",
    title: "all / padding",
    items: [
      { m: "all", v: "initial" },
      { m: "p", v: "1rem" },
    ],
  },
  {
    id: "a2",
    kind: "contain",
    title: "all / color",
    items: [
      { m: "all", v: "initial" },
      { m: "color", v: "red" },
    ],
  },
  {
    id: "a3",
    kind: "contain",
    title: "all / border",
    items: [
      { m: "all", v: "initial" },
      { m: "border", v: "1px solid red" },
    ],
  },
  {
    id: "a4",
    kind: "contain",
    title: "all / border-top-width",
    items: [
      { m: "all", v: "initial" },
      { m: "borderTopWidth", v: "3px" },
      { m: "borderTopStyle", v: "solid" },
    ],
  },
  {
    id: "a5",
    kind: "contain",
    title: "all / font-size",
    items: [
      { m: "all", v: "initial" },
      { m: "fontSize", v: "20px" },
    ],
  },

  // container, as far as it is reachable: containerType and containerName are properties, `container` is the wrapper
  {
    id: "c1",
    kind: "contain",
    title: "container-type / container-name (no shorthand)",
    items: [
      { m: "containerType", v: "inline-size" },
      { m: "containerName", v: "side" },
    ],
  },

  // conditions
  {
    id: "h1",
    kind: "layer",
    title: "hover(p) / pl",
    items: [
      { m: "p", v: "1rem", w: ["hover"] },
      { m: "pl", v: "0.5rem" },
    ],
  },
  {
    id: "h2",
    kind: "layer",
    title: "hover(pl) / p",
    items: [
      { m: "pl", v: "1rem", w: ["hover"] },
      { m: "p", v: "0.5rem" },
    ],
  },
  {
    id: "h3",
    kind: "contain",
    title: "hover(p) / hover(pl)",
    items: [
      { m: "p", v: "1rem", w: ["hover"] },
      { m: "pl", v: "0.5rem", w: ["hover"] },
    ],
  },
  {
    id: "h4",
    kind: "cond",
    title: "md(p) / hover(pl)",
    items: [
      { m: "p", v: "1rem", w: ["md"] },
      { m: "pl", v: "2rem", w: ["hover"] },
    ],
  },
  {
    id: "h5",
    kind: "cond",
    title: "hover(p) / md(pl)",
    items: [
      { m: "p", v: "1rem", w: ["hover"] },
      { m: "pl", v: "2rem", w: ["md"] },
    ],
  },
  {
    id: "h8",
    kind: "cond",
    title: "focus(p) / hover(pl)",
    items: [
      { m: "p", v: "1rem", w: ["focus"] },
      { m: "pl", v: "2rem", w: ["hover"] },
    ],
  },
  {
    id: "h9",
    kind: "cond",
    title: "hover(p) / focus(pl)",
    items: [
      { m: "p", v: "1rem", w: ["hover"] },
      { m: "pl", v: "2rem", w: ["focus"] },
    ],
  },
  {
    id: "h6",
    kind: "layer",
    title: "md(hover(p)) / md(pl)",
    items: [
      { m: "p", v: "1rem", w: ["md", "hover"] },
      { m: "pl", v: "2rem", w: ["md"] },
    ],
  },
  {
    id: "h7",
    kind: "contain",
    title: "md(p) / md(pl)",
    items: [
      { m: "p", v: "1rem", w: ["md"] },
      { m: "pl", v: "2rem", w: ["md"] },
    ],
  },

  {
    id: "h10",
    kind: "cond",
    title: "md(color) / hover(color)",
    items: [
      { m: "color", v: "red", w: ["md"] },
      { m: "color", v: "blue", w: ["hover"] },
    ],
  },
  {
    id: "h11",
    kind: "cond",
    title: "md(pl) / lg(p)",
    items: [
      { m: "pl", v: "0.5rem", w: ["md"] },
      { m: "p", v: "1rem", w: ["lg"] },
    ],
  },
  {
    id: "h12",
    kind: "cond",
    title: "lg(pl) / md(p)",
    items: [
      { m: "pl", v: "0.5rem", w: ["lg"] },
      { m: "p", v: "1rem", w: ["md"] },
    ],
  },

  // two modules
  {
    id: "x1",
    kind: "contain",
    title: "p in one module, pl in another",
    modules: true,
    items: [
      { m: "p", v: "1rem" },
      { m: "pl", v: "0.5rem" },
    ],
  },
  {
    id: "x2",
    kind: "contain",
    title: "border-inline in one module, border-inline-start in another",
    modules: true,
    items: [
      { m: "borderInline", v: "1px solid red" },
      { m: "borderInlineStart", v: "3px dashed blue" },
    ],
  },
  {
    id: "x3",
    kind: "contain",
    title: "all in one module, color in another",
    modules: true,
    items: [
      { m: "all", v: "initial" },
      { m: "color", v: "red" },
    ],
  },
];
