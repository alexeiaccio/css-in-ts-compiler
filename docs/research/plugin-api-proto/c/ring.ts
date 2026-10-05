// (a) a `ring` context: two methods and a kernel. The author writes tokens and one rule; nothing else.
import { plugin } from "cssints/plugin";

const p = plugin("ring");

// --ring-width and --ring-color, `@property` (non-inheriting) with these defaults; each leaf is a setter.
export const tokens = p.tokens({
  width: { $type: "dimension", $value: "2px" },
  color: { $type: "color", $value: "#2563eb" },
});

// `ring()` is the marker class `_ring` and this rule; `.width()` and `.color()` come from the tokens.
export const ring = p.context(tokens, {
  kernel: (css) => css.outline(tokens.width, "solid", tokens.color),
});
