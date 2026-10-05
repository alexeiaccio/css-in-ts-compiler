import { createTokens } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

const t = createTokens({ color: { $type: "color", bg: { $value: "#ffffff" } } });
export const a = look(t, "dark mode", "app", { color: { bg: "#000000" } });
