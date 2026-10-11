import { createTokens } from "cssints" with { type: "cssints" };
import { colors, easings, radii, sizes } from "@cssints/tokens/open-props";
import { light } from "@cssints/tokens/radix";

// Open Props as tokens (every leaf is a token, typed by its $type) and the Radix colour scales: one set per subpath, so a
// build holds only the sets it imports.
export const op = createTokens({
  ...colors,
  size: sizes,
  radius: radii,
  ease: easings,
});
export const rx = createTokens({ radix: { blue: light.blue, gray: light.gray } });
