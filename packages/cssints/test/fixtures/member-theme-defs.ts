import { createTokens } from "cssints" with { type: "cssints" };
import { modes } from "./member-theme-kit.ts" with { type: "cssints" };

export const t = createTokens({
	mem: {
		$type: "color",
		bg: { $value: "#ffffff" },
		edge: { $value: "color-mix(in oklab, {mem.bg}, black 10%)" },
	},
});
// a definition site: a function, nothing of it ships; its calls in the client modules are the sites
export const dark = modes(t, { mem: { bg: "#000000" } });
export const bad = modes(t, { mem: { bg: "blu" } });
