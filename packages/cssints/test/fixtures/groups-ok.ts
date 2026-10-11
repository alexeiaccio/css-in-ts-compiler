import * as css from "cssints/widely-available" with { type: "cssints" };
import {
  alignItems,
  color,
  display,
  hover,
  media,
  width,
} from "cssints/widely-available" with { type: "cssints" };

export const a = css.cn(
  display("grid"),
  color("rebeccapurple"),
  width("calc(100% - 2rem)"),
  alignItems(css.firstThatWorks("center", "start")),
  hover(color("red")),
  media("(width >= 40rem)")(css.padding(4)),
);
// a layout context sets display too, so it goes in a call of its own
export const b = css.flex().gap("1rem").direction("column");
