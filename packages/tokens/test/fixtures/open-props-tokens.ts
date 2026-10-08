import { createGlobalTheme, createTokens } from "cssints" with { type: "cssints" };
import {
  colors,
  easings,
  fontSizes,
  letterSpacings,
  radii,
  remSizes,
  shadows,
  shadowsDark,
  sizes,
} from "@cssints/tokens/open-props";

export const t = createTokens(
  {
    ...colors,
    size: sizes,
    space: remSizes,
    radius: radii,
    text: fontSizes,
    tracking: letterSpacings,
    ease: easings,
    shadow: shadows,
  },
  // a letter spacing in em is the element's: a token that does not inherit is computed on each element
  (path) => ({
    var: path.map((k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)).join("-"),
    inherit: path[0] !== "tracking",
  }),
);
createGlobalTheme(t.shadow, ".dark", shadowsDark);
