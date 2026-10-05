import { createTokens } from "cssints";
import { look } from "./examples/look.ts";

const tokens = createTokens({
  color: { bg: { $value: "#ffffff", $type: "color" }, ink: { $value: "#000000", $type: "color" } },
  typography: { size: { $value: "1rem", $type: "dimension" } },
});
export const a: string = look({ tokens, expression: "dark", source: "app", values: { color: { bg: "#0b0b0f" }, typography: { size: "1.5rem" } } });
export const b = look({ tokens, expression: '"com.alice.midnight"', source: "author", values: { color: { bg: "#0a0a12" } } });
export const c = look({ tokens, expression: "hero", source: "author", values: { color: { bg: "#123456" } }, scope: "article.post" });
// @ts-expect-error a source is app, author or viewer
look({ tokens, expression: "dark", source: "user", values: { color: { bg: "#000" } } });
// @ts-expect-error not a colour
look({ tokens, expression: "dark", source: "app", values: { color: { bg: "banana" } } });
// @ts-expect-error no such token
look({ tokens, expression: "dark", source: "app", values: { color: { nope: "#000" } } });
// @ts-expect-error a dimension, not a colour
look({ tokens, expression: "dark", source: "app", values: { typography: { size: "red" } } });
// @ts-expect-error not an expression
look({ tokens, expression: "1px", source: "app", values: { color: { bg: "#000" } } });
// @ts-expect-error unknown argument
look({ tokens, expression: "dark", source: "app", values: { color: { bg: "#000" } }, scoped: "x" });
// @ts-expect-error a required argument is missing
look({ tokens, expression: "dark", source: "app" });
