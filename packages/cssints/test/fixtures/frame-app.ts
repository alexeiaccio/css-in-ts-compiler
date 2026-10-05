// A client app on cssints/frame: a three-deep tree (frame, frame, plain div, frame, frame), a lone frame, an `em` padding
// read by a child of another font size, a `rem` padding on a frame of another font size (WebKit before 18.5 read it wrong
// while the frame's sentinel transition ran), and a frame whose padding follows a media query. test/browsers.mjs builds it
// and reads the computed radii in browsers.
import "virtual:cssints.css";
import { cn, media } from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const narrow = media("(width < 500px)");
const cls = {
  f1: cn(frame().radius("24px").padding("8px").border("2px"), narrow(frame().padding("16px"))),
  f2: frame().padding("6px").border("1px").margin("3px"),
  f2Margin: frame().padding("6px").border("1px").margin("5px"),
  f3: frame().padding("4px").radius("40px"),
  f4: frame(),
  iso: frame().radius("24px"),
  em1: frame().radius("24px").padding("1em"),
  em2: frame(),
  rp: frame().radius("30px").padding("4px"),
  rem1: frame().padding("1rem"),
  rem2: frame(),
  added: frame().padding("2px"),
};
Object.assign(globalThis, { cls });
document.body.innerHTML = `
<div id=f1 class="${cls.f1}"><div id=f2 class="${cls.f2}"><div><div id=f3 class="${cls.f3}"><div id=f4 class="${cls.f4}"></div></div></div></div></div>
<div id=iso class="${cls.iso}"></div>
<div id=em1 class="${cls.em1}" style="font-size:20px"><div id=em2 class="${cls.em2}" style="font-size:10px"></div></div>
<div id=rp class="${cls.rp}"><div id=rem1 class="${cls.rem1}" style="font-size:20px"><div id=rem2 class="${cls.rem2}"></div></div></div>`;
