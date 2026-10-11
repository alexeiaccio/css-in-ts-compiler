import * as grid from "cssints/css-grid-2" with { type: "cssints" };
import * as color from "cssints/css-color-5" with { type: "cssints" };
import * as mq from "cssints/mediaqueries-5" with { type: "cssints" };
import * as all from "cssints/limited-availability" with { type: "cssints" };

export const a = [
  grid.gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
  grid.gridTemplateRows("subgrid"),
  color.color("color-mix(in oklab, red, blue)"),
  color.colorMix("in oklab", "red", "blue"),
  mq.media("(prefers-color-scheme: dark)")(grid.gridAutoFlow("dense")),
  all.display("grid-lanes"),
];
