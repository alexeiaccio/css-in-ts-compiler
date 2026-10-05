import { createTokens } from "cssints";
import type { Style } from "cssints/plugin";

import { look } from "../../src/index.ts";

const t = createTokens({
  color: { $type: "color", bg: { $value: "#ffffff" }, ink: { $value: "#111111" } },
  typography: { $type: "dimension", size: { $value: "16px" } },
});

export const appDark: Style = look(t, "dark", "app", {
  color: { bg: "#0b0b0f" },
  typography: { size: "24px" },
});
export const viewerDark = look(t, "dark", "viewer", { color: { bg: "#101018" } });
export const authorMidnight = look(t, '"com.alice.midnight"', "author", {
  color: { bg: "#0a0a12" },
});
export const contained = look(
  t,
  "hero",
  "author",
  { color: { bg: "#123456" } },
  { scope: "article.post" },
);
export const refs = look(t, "refs", "app", { color: { bg: "{color.ink}" } });

// @ts-expect-error not a colour
export const e1 = look(t, "dark", "app", { color: { bg: "banana" } });
// @ts-expect-error no such token
export const e2 = look(t, "dark", "app", { color: { nope: "red" } });
// @ts-expect-error a length is not a colour
export const e3 = look(t, "dark", "app", { color: { bg: "1rem" } });
// @ts-expect-error a colour is not a length
export const e4 = look(t, "dark", "app", { typography: { size: "red" } });
// @ts-expect-error not a source
export const e5 = look(t, "dark", "owner", { color: { bg: "red" } });
// @ts-expect-error a token set first
export const e6 = look("dark", "app", { color: { bg: "red" } });
// @ts-expect-error scope is a selector
export const e7 = look(t, "dark", "app", { color: { bg: "red" } }, { scope: "(" });
// @ts-expect-error a reference to a token that does not exist
export const e8 = look(t, "dark", "app", { color: { bg: "{color.nope}" } });
