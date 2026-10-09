import "virtual:cssints.css";
import { color, p } from "cssints" with { type: "cssints" };

Object.assign(globalThis, {
  cls: [color("rebeccapurple"), p(2)].join(" "),
});
