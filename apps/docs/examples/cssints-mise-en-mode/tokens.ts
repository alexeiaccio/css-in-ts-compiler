import { createTokens } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

export const t = createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111111" },
  },
});

// look(tokens, expression, source, overrides, { scope? }): a look is a theme on [data-mode], in the layers app < author < viewer,
// so a reader's choice beats the page's, and the page's beats the app's.
look(t, "dark", "app", { color: { bg: "#0b0b0f", fg: "#f3f4f6" } });
look(t, "dark", "viewer", { color: { bg: "#101018" } });
look(t, "hero", "author", { color: { bg: "#123456", fg: "#f8fafc" } }, { scope: "article.post" });
