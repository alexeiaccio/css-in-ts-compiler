import { look } from "cssints/mise-en-mode" with { type: "cssints" };

export const appDark = look("dark", "app", {
	"--color-bg": "#0b0b0f",
	"--typography-text-primary-size": "1.5rem",
});
export const viewerDark = look("dark", "viewer", { "--color-bg": "#101018" });
export const authorMidnight = look('"com.alice.midnight"', "author", { "--color-bg": "#0a0a12" });
export const contained = look("hero", "author", { "--color-bg": "#123456" }, { scope: "article.post" });
