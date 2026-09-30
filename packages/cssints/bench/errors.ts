import {
  border,
  boxShadow,
  color,
  display,
  margin,
  padding,
  transition,
} from "cssints" with { type: "cssints" };
import { CSS } from "cssints" with { type: "cssints" };

padding("2px", "red");
padding("1px", "2px", "3px", "4px", "5px");
border("1px", "solid", "nope");
border("1px", "solud", "red");
margin(CSS.px(1), "red");
transition("opacity", "0.2s", "ease", "bad");
boxShadow("0 0 1px", "red", "bad");
margin("auto", "1rem", "bad", "2rem");
// a word that keywords begin: the editor is offered them
display("fl");
color("re");
border("1px", "so");
border("1px", "");
