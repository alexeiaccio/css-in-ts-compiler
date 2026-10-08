import { createTokens } from "cssints" with { type: "cssints" };
import { light, lightAlpha } from "@cssints/tokens/radix";

export const t = createTokens({ radix: light });
export const ta = createTokens({ radix: lightAlpha });
