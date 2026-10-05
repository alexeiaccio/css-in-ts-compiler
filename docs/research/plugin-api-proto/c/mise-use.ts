import * as css from "cssints";
import { look } from "./mise-en-mode.ts";

export const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: "oklch(62% 0.19 259)" },
    edge: { $value: "color-mix(in oklab, {color.bg}, black 10%)" },
  },
  typography: { size: { $type: "dimension", $value: "16px" } },
  space: { md: { $type: "dimension", $value: "16px" } },
});

look(t, "dark", "app", { color: { bg: "#0b0b0f", fg: "#f3f4f6" }, typography: { size: "24px" } });
look(t, "dark", "viewer", { color: { bg: "#101018" } });
look(t, "com.alice.midnight", "author", { color: { bg: "#0a0a12" } });
look(t, "hero", "author", { color: { bg: "#123456" } }, { scope: "article.post" });
look(t, "roomy", "app", { space: { md: "24px" } });

// a look is a theme: the check sees it, and fill-through (viewer over app) is the engine's business
css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 });

// @ts-expect-error no token at this path
look(t, "dark", "app", { color: { nope: "red" } });
// @ts-expect-error a colour, not a length
look(t, "dark", "app", { color: { bg: "1px" } });
// @ts-expect-error a source that is not a layer of the contract
look(t, "dark", "user", { color: { bg: "red" } });
// @ts-expect-error a reference to a token that does not exist
look(t, "dark", "app", { color: { edge: "{color.nope}" } });
look(t, "dark", "app", { color: { edge: "{color.accent}" } });
