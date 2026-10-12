import {
  border,
  createGlobalTheme,
  createTokens,
  global,
  layers,
  margin,
  p,
} from "cssints" with { type: "cssints" };
import { reset } from "@cssints/reset" with { type: "cssints" };

reset({ media: true, prose: true });
// the same base again: one rule in the sheet
reset();

layers("app");
const t = createTokens({ color: { $type: "color", bg: { $value: "#ffffff" } } });
createGlobalTheme(t, '[data-mode="dark"]', { color: { bg: "#000000" } }, { layer: "app" });
global("body", margin("1rem"));
export const card = p(2);
export const edge = border("1px solid red");
