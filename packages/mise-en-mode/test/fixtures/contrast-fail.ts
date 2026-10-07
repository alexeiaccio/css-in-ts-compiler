import { check, createTokens } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

const t = createTokens({
	cly: { $type: "color", bg: { $value: "#ffffff" }, fg: { $value: "#000000" } },
});

// the app's look sets both colours; a viewer's look sets only the text, and is read on the app's background
look(t, "dark", "app", { cly: { bg: "#111111", fg: "#eeeeee" } });
look(t, "dark", "viewer", { cly: { fg: "#222222" } });
check.contrast(t.cly.fg, t.cly.bg, { min: 4.5 });
