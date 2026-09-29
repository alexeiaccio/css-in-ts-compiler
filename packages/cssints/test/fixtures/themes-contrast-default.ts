import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  cdef: { $type: "color", bg: { $value: "#ffffff" }, fg: { $value: "#777777" } },
});
css.check.contrast(t.cdef.fg, t.cdef.bg, { min: 4.5 });
