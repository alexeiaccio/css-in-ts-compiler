import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { madoromi } from "@cssints/tokens/madoromi";

// haru by day as the tokens, haru by night under the dark scheme, every other flavour on a data attribute
export const t = createTokens({ madoromi: madoromi.haruHiru });
createGlobalTheme(t.madoromi, media("(prefers-color-scheme: dark)"), madoromi.haruYoru);
for (const id of ["natsuHiru", "akiHiru", "fuyuHiru", "natsuYoru", "akiYoru", "fuyuYoru"] as const)
  createGlobalTheme(t.madoromi, `[data-madoromi="${id}"]`, madoromi[id]);

// the style guide's text on paper, in every flavour (README "Contrast")
check.contrast(t.madoromi.sumi, t.madoromi.kami, { min: 7 });
check.contrast(t.madoromi.roles.text, t.madoromi.chitsu, { min: 4.5 });
check.contrast(t.madoromi.usuzumi0, t.madoromi.kami, { min: 4.5 });
check.contrast(t.madoromi.kasure2, t.madoromi.kami, { min: 3 });
