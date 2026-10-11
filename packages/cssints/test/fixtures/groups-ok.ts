import { cx } from "cssints";
import * as css from "cssints/widely-available" with { type: "cssints" };
import { alignItems, color, display, hover, media, width } from "cssints/widely-available" with { type: "cssints" };

export const a = cx(
  display("grid"),
  color("rebeccapurple"),
  width("calc(100% - 2rem)"),
  alignItems(css.firstThatWorks("center", "start")),
  hover(color("red")),
  media("(width >= 40rem)")(css.padding(4)),
  css.flex().gap("1rem").direction("column"),
);
