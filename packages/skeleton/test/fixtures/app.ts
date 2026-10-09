import "virtual:cssints.css";
import { cn, height } from "cssints" with { type: "cssints" };

import { skeleton } from "../../src/index.ts" with { type: "cssints" };

// black with a white band, so a phase shows in the pixels; test/browsers.mjs mounts the boxes
declare global {
  var skeletonClass: string;
}
globalThis.skeletonClass = cn(
  skeleton().radius("0").color("#000").highlight("#fff"),
  height("40px"),
);
