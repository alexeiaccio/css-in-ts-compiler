// The keywords an editor offers inside a string that is not a value yet (`Hint`, css.ts), and that offering them does
// not make a bad value good. `bench/complete.mjs` shows what tsgo's language server does with them.
import type { Hint } from "@cssints/css-grammar/css";
import { border, display, font } from "cssints" with { type: "cssints" };

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const equal = <A, B>(_: Equal<A, B>) => {};

equal<Hint<"display", "fl">, "flex" | "flow" | "flow-root">(true);
equal<Hint<"display", "FL">, "flex" | "flow" | "flow-root">(true);
equal<Hint<"color", "rebecca">, "rebeccapurple">(true);
equal<Hint<"color", "ACC">, "AccentColor" | "AccentColorText">(true);
// The words before the last one stay: the editor replaces the whole string.
equal<Hint<"border", "1px so">, "1px solid">(true);
// The word itself is not offered, and a word no keyword begins gives nothing.
equal<Hint<"display", "flex">, never>(true);
equal<Hint<"display", "zzz">, never>(true);
// A property with no keyword gives nothing.
equal<Hint<"padding", "1px 2">, never>(true);

// An empty part is offered everything, and is an error.
border(
  "1px",
  // @ts-expect-error an empty part is no value
  "",
);
// A keyword that completes nothing stays an error: the hints are never the bad value itself.
font(
  // @ts-expect-error a size and a family are missing
  "bold",
);
border(
  "1px",
  "solid",
  // @ts-expect-error a line style twice
  "solid",
);
display(
  // @ts-expect-error not a display value
  "flexx",
);
