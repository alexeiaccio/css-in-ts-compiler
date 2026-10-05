//#region src/index.d.ts
declare const mise: import("cssints/plugin").Scope<"mise-en-mode", {
  readonly "#sources": {
    readonly layers: readonly ["app", "author", "viewer"];
  };
  readonly look: {
    readonly args: readonly ["$tokens", "<custom-ident> | <string>", "app | author | viewer", "$overrides", {
      readonly "scope?": "$selector";
    }];
    readonly uses: readonly ["sources"];
  };
}>;
/**
 * `look(tokens, expression, source, overrides, { scope? })`: the theme of one `data-mode` expression, in the layer of its
 * `source` (`"app"`, `"author"` or `"viewer"`), so a viewer's look fills over an author's over the app's, value by value.
 * `overrides` are values by token path, split by their top-level groups (aspects): `data-mode="dark"` takes every aspect,
 * `data-mode="dark/color"` only the color group. They are checked against `tokens` in the types and at build time, and
 * `check.contrast` reads them with the other looks of the expression. With `scope` the look is confined to that subtree
 * (`@scope`, Rule 7). A dotted reverse-DNS expression is quoted: `look(t, '"com.alice.midnight"', "author", { … })`. Call it
 * at a module's top level; it prints no class.
 */
export declare const look: ReturnType<typeof mise.export>["look"];
//#endregion