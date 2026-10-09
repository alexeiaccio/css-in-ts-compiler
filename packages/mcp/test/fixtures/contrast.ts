import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  c: { $type: "color", fg: { $value: "#777" }, bg: { $value: "#fff" } },
});
css.check.contrast(t.c.fg, t.c.bg, { min: 4.5 });
