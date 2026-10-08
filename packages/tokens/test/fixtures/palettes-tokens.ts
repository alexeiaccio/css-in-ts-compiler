import { createTokens } from "cssints" with { type: "cssints" };
import { flexoki } from "@cssints/tokens/flexoki";
import { reasonableColors } from "@cssints/tokens/reasonable-colors";

export const t = createTokens({ flexoki, reasonable: reasonableColors });
