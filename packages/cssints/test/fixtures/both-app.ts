// A client app that nests frame() and surface() together: c1 > c2 > plain div > fo (a frame only) > so (a surface only)
// > c3, where c1, c2 and c3 are both on one element; a media query changes both on c1, a hover on c1 only its surface.
// e1 > e2: a hover on e1 changes only its frame. test/browsers.mjs builds it, reads the radii and colours, and counts the
// observers the page makes (one, for both runtimes).
import "virtual:cssints.css";
import { cn, hover, media } from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

const narrow = media("(width < 500px)");
const cls = {
  c1: cn(
    frame().radius("40px").padding("8px").border("2px"),
    surface().color("#2b3a67"),
    narrow(cn(frame().padding("16px"), surface().lighten(0.1))),
    hover(surface().lighten(0.1)),
  ),
  c2: cn(frame().padding("6px").border("1px").margin("3px"), surface().lighten(0.06)),
  fo: frame().padding("4px"),
  so: surface().darken(0.1),
  c3: cn(frame().padding("2px"), surface().lighten(0.06)),
  e1: cn(
    frame().radius("30px").padding("4px"),
    surface().color("#2b3a67"),
    hover(frame().padding("10px")),
  ),
  e2: cn(frame().padding("2px"), surface().lighten(0.06)),
};
Object.assign(globalThis, { cls });
document.body.innerHTML = `
<div id=c1 class="${cls.c1}"><div id=c2 class="${cls.c2}"><div><div id=fo class="${cls.fo}"><div id=so class="${cls.so}"><div id=c3 class="${cls.c3}"></div></div></div></div></div></div>
<div id=e1 class="${cls.e1}"><div id=e2 class="${cls.e2}"></div></div>`;
