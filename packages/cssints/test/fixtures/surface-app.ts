// A client app on cssints/surface: a tree five deep (s0 > s1 > plain div > s2 > s3 > s4), a light tree that contrasts
// twice (t0 > t1 > t2), a surface on no base (r0), a token as the base (tk), a hover on a surface with a child (h1 > h2)
// and a step that follows a media query. test/browsers.mjs builds it and reads the computed colours in browsers.
import "virtual:cssints.css";
import { cn, hover, media, token } from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

const base = token.color("#2b3a67", { var: "base", inherit: true });
const narrow = media("(width < 500px)");
const cls = {
  s0: surface().color("#2b3a67"),
  s1: cn(surface().lighten(0.06), narrow(surface().lighten(0.2))),
  s2: surface().lighten(0.06).ink(),
  s3: surface().darken(0.1),
  s4: surface().contrast(0.15),
  t0: surface().color("#dde6f5"),
  t1: surface().contrast(0.15).ink(),
  t2: surface().contrast(0.15),
  r0: surface().darken(0.1),
  tk: surface().color(base).lighten(0.06),
  h1: cn(surface().color(base).lighten(0.02), hover(surface().lighten(0.1))),
  h2: surface().lighten(0.06),
  added: surface().darken(0.1),
};
Object.assign(globalThis, { cls });
document.body.innerHTML = `
<div id=s0 class="${cls.s0}"><div id=s1 class="${cls.s1}"><div><div id=s2 class="${cls.s2}"><div id=s3 class="${cls.s3}"><div id=s4 class="${cls.s4}"></div></div></div></div></div></div>
<div id=t0 class="${cls.t0}"><div id=t1 class="${cls.t1}"><div id=t2 class="${cls.t2}"></div></div></div>
<div id=r0 class="${cls.r0}"></div>
<div id=tk class="${cls.tk}"></div>
<div id=h1 class="${cls.h1}" style="padding:20px"><div id=h2 class="${cls.h2}">h</div></div>`;
