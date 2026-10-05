// A plugin member that emits themes over a token set it was given: closed over, since a member's arguments are one string.
import { style } from "cssints/plugin";

export const modes = (tokens: object, overrides: object) =>
	style("<custom-ident>", (name) => ({
		decls: [],
		layers: ["app", "viewer"],
		themes: [{ tokens, overrides, selector: `[data-mode="${name}"]`, layer: "viewer" }],
	}));
