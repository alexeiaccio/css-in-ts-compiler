import { plugin } from "cssints/plugin";
const p = plugin("x");
const tokens = p.tokens({
  radius: { $type: "dimension", $value: "0px" },
  padding: { $type: "dimension", $value: "0px" },
});
export const k = p.context(tokens, { kernel: { css: "._x{padding:var(--x-padding)}" } });
