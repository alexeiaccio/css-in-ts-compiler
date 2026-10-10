import "virtual:cssints.css";
import { color, p } from "cssints" with { type: "cssints" };

Object.assign(globalThis, {
  cls: [color("rebeccapurple"), p(2)].join(" "),
});

// the sites are evaluated once without a page, hence `?.`
document.getElementById("p")?.setAttribute("class", String((globalThis as { cls?: string }).cls));
