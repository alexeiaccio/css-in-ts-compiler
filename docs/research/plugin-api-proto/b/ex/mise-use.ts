import { createTokens } from "cssints";
import { look } from "@cssints/mise-en-mode";

const t = createTokens({
  color: { $type: "color", bg: { $value: "#ffffff" }, ink: { $value: "#111111" } },
  typography: { $type: "dimension", size: { $value: "1rem" } },
});

export const appDark = look(t, "dark", "app", { color: { bg: "#0b0b0f" }, typography: { size: "1.5rem" } });
export const viewerDark = look(t, "dark", "viewer", { color: { bg: "#101018" } });
export const authorMidnight = look(t, '"com.alice.midnight"', "author", { color: { bg: "#0a0a12" } });
export const contained = look(t, "hero", "author", { color: { bg: "#123456" } }, { scope: "article.post" });
export const refs = look(t, "refs", "app", { color: { bg: "{color.ink}" } });

// @ts-expect-error not a colour
export const e1 = look(t, "dark", "app", { color: { bg: "banana" } });
// @ts-expect-error no such token
export const e2 = look(t, "dark", "app", { color: { nope: "red" } });
// @ts-expect-error not a layer
export const e3 = look(t, "dark", "owner", { color: { bg: "red" } });
// @ts-expect-error not an expression
export const e4 = look(t, "1 2", "app", { color: { bg: "red" } });
// @ts-expect-error a length is not a colour
export const e5 = look(t, "dark", "app", { color: { bg: "1rem" } });
// @ts-expect-error scope is not a number
export const e6 = look(t, "dark", "app", { color: { bg: "red" } }, { scope: 1 });
// @ts-expect-error a token set first
export const e7 = look("dark", "app", { color: { bg: "red" } });
