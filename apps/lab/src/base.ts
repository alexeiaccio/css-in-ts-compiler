import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, color, colorScheme, fontFamily, global } from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// The page's frame, in the sheet's layer _.k: the reset, the writing colour and the two colour schemes. Every class of a
// story is above it, so nothing here fights a story.
reset();
global(
  "html",
  bg(t.color.bg),
  color(t.color.text),
  fontFamily("system-ui, -apple-system, Segoe UI, Roboto, sans-serif"),
  colorScheme("light"),
);
global("html.dark", colorScheme("dark"));
