import * as css from "cssints" with { type: "cssints" };

// Rules with no class: a reset, the colour scheme. They go to layer _.k, below every class, so a component never fights them.
css.global("*, *::before, *::after", css.boxSizing("border-box"));
css.global("body", css.margin("0"), css.fontFamily("system-ui, sans-serif"));
css.global(
  ":root",
  css.colorScheme("light"),
  css.media("(prefers-color-scheme: dark)")(css.colorScheme("dark")),
);
