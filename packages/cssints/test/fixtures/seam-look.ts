// A plugin member that emits a global rule in a declared layer, over declarations it closed over (a member's arguments are one string).
import { style } from "cssints/plugin";

export const look = (name: string, layer: string, declarations: Record<string, string>) =>
	style("<custom-ident>", () => ({
		decls: [],
		layers: ["app", "author", "viewer"],
		globals: [
			{
				css: `[data-mode="${name}"] { ${Object.entries(declarations)
					.map(([k, v]) => `${k}: ${v}`)
					.join("; ")} }`,
				layer,
			},
		],
	}))(name);
