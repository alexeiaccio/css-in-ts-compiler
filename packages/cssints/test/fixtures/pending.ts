import { css } from "cssints" with { type: "cssints" };

// A var() or an env() stands for any value, wherever it is: the rest of the value is still checked.
export const a = [
  css.padding("var(--user-thing)"),
  css.padding("var(--a)", "2px"),
  css.margin("env(safe-area-inset-top)", "auto"),
  css.border("1px", "var(--x)", "solid"),
  css.fontFamily("var(--font), sans-serif"),
];
