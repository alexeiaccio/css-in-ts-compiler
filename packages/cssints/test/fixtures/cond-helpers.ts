import * as css from "cssints" with { type: "cssints" };

// Breakpoints shared by modules: imported with the attribute, so their wrappers run at build time.
export const [md, lg] = css.media("(width >= 40rem)", "(width >= 60rem)");
export const dark = css.media("(prefers-color-scheme: dark)");
