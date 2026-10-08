import { createTokens } from "cssints" with { type: "cssints" };
import { colors, radii, sizes } from "@cssints/tokens/open-props";

export const t = createTokens({ ...colors, size: sizes, radius: radii });
