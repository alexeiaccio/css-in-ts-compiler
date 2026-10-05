import { check, createTokens } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

const t = createTokens({
	clp: { $type: "color", bg: { $value: "#ffffff" }, fg: { $value: "#000000" } },
});

// the app's look sets both colours; a viewer's look sets only the text, and is read on the app's background
look(t, "dark", "app", { clp: { bg: "#111111", fg: "#eeeeee" } });
look(t, "dark", "viewer", { clp: { fg: "#dddddd" } });
check.contrast(t.clp.fg, t.clp.bg, { min: 4.5 });
