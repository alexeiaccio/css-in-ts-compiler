import { scope } from "cssints/plugin";
//#region src/index.ts
const selector = (expression, aspect) => `:where([data-mode="${expression}"], [data-mode~="${expression}/${aspect}"])`;
/**
* `look(tokens, expression, source, overrides, { scope? })`: the theme of one `data-mode` expression, in the layer of its
* `source` (`"app"`, `"author"` or `"viewer"`), so a viewer's look fills over an author's over the app's, value by value.
* `overrides` are values by token path, split by their top-level groups (aspects): `data-mode="dark"` takes every aspect,
* `data-mode="dark/color"` only the color group. They are checked against `tokens` in the types and at build time, and
* `check.contrast` reads them with the other looks of the expression. With `scope` the look is confined to that subtree
* (`@scope`, Rule 7). A dotted reverse-DNS expression is quoted: `look(t, '"com.alice.midnight"', "author", { … })`. Call it
* at a module's top level; it prints no class.
*/
const look = scope("mise-en-mode", {
	"#sources": { layers: [
		"app",
		"author",
		"viewer"
	] },
	look: {
		args: [
			"$tokens",
			"<custom-ident> | <string>",
			"app | author | viewer",
			"$overrides",
			{ "scope?": "$selector" }
		],
		uses: ["sources"]
	}
}).build({ look: (tokens, expression, source, overrides, options) => ({ themes: Object.entries(overrides).map(([aspect, values]) => ({
	tokens,
	overrides: { [aspect]: values },
	selector: selector(expression.replace(/^"|"$/g, ""), aspect),
	layer: source,
	scope: options.scope
})) }) }).export().look;
//#endregion
export { look };
