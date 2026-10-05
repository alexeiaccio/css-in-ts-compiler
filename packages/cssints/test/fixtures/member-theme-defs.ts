import { createTokens } from "cssints" with { type: "cssints" };

export const t = createTokens({
	mem: {
		$type: "color",
		bg: { $value: "#ffffff" },
		edge: { $value: "color-mix(in oklab, {mem.bg}, black 10%)" },
	},
});
