import { createTokens } from "cssints";
import { look } from "../examples/look.ts";

const tokens = createTokens({
  color: {
    bg: { $value: "#ffffff", $type: "color" },
    ink: { $value: "#000000", $type: "color" },
    accent: { $value: "#0af", $type: "color" },
  },
  typography: { size: { $value: "1rem", $type: "dimension" }, lead: { $value: "1.5rem", $type: "dimension" } },
});
export const calls = [
  look({ tokens, expression: "dark", source: "app", values: { color: { bg: "#0b0b0f", ink: "#eee" } } }),
  look({ tokens, expression: "dark", source: "viewer", values: { color: { bg: "#101018" } } }),
  look({ tokens, expression: '"com.alice.midnight"', source: "author", values: { color: { bg: "#0a0a12", accent: "oklch(0.7 0.1 250)" } } }),
  look({ tokens, expression: "hero", source: "author", values: { color: { bg: "#123456" } }, scope: "article.post" }),
  look({ tokens, expression: "dark", source: "app", values: { typography: { size: "1.5rem", lead: "2rem" } } }),
  look({ tokens, expression: "light", source: "app", values: { color: { bg: "#fff", ink: "#111", accent: "#06c" }, typography: { size: "1rem" } } }),
  look({ tokens, expression: "dim", source: "app", values: { color: { bg: "#223" } } }),
  look({ tokens, expression: "dim", source: "viewer", values: { color: { ink: "#ddd" } } }),
  look({ tokens, expression: "paper", source: "author", values: { color: { bg: "#f6f1e7", ink: "#222" } } }),
  look({ tokens, expression: "paper", source: "author", values: { typography: { size: "1.125rem" } } }),
];
