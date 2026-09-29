/* oxlint-disable */
import { BROWSER, launch, load, settle } from "./lib.mjs";

const frameHtml = `
<div id=f1 class="f r24 p8 b2"><div id=f2 class="f p6 b1 m3"><div><div id=f3 class="f p4 r40"><div id=f4 class="f"></div></div></div></div></div>
<div id=iso class="f r24"></div>
<div id=fa class="f p8 r24"><div id=fb class="f p6"><div id=fc class="f"></div></div></div>`;
const surfHtml = `
<div id=s0 class="s base"><div id=s1 class="s up6"><div><div id=s2 class="s up6b"><div id=s3 class="s dn10"><div id=s4 class="s con"></div></div></div></div></div></div>
<div id=t0 class="s lightbase"><div id=t1 class="s con"><div id=t2 class="s con"></div></div></div>`;
const bothHtml = `
<div id=c0 class="f s base r24 p8 b2"><div id=c1 class="f s up6 p4"><div><div id=c2 class="f s dn10 p2 m3"></div></div></div></div>`;
const dynHtml = `
<div id=d0 class="f s w base r24 p8 b2 hov resp"><div id=d1 class="f s up6 p4"><div id=d2 class="f s up6 p4"></div></div></div>`;
const HTML = frameHtml + surfHtml + bothHtml + dynHtml;
const IDS = [
  "f1",
  "f2",
  "f3",
  "f4",
  "iso",
  "fa",
  "fb",
  "fc",
  "s0",
  "s1",
  "s2",
  "s3",
  "s4",
  "t0",
  "t1",
  "t2",
  "c0",
  "c1",
  "c2",
  "d0",
  "d1",
  "d2",
];

const read = (page) =>
  page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => {
          const c = getComputedStyle(document.getElementById(id));
          return [id, { r: c.borderTopLeftRadius, p: c.paddingTop, bg: c.backgroundColor }];
        }),
      ),
    IDS,
  );

const nums = (s) => (s.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number);
let bad = 0,
  worst = 0,
  cmpCount = 0;
function compare(label, ref, got) {
  for (const id of IDS)
    for (const k of ["r", "p", "bg"]) {
      cmpCount++;
      const a = ref[id][k],
        b = got[id][k];
      if (a === b) continue;
      const na = nums(a),
        nb = nums(b);
      const d =
        na.length === nb.length ? Math.max(...na.map((x, i) => Math.abs(x - nb[i]))) : Infinity;
      worst = Math.max(worst, d);
      if (d > 1e-3) {
        bad++;
        console.log(`  MISMATCH ${label} ${id}.${k}: ref ${a} got ${b}`);
      } else
        console.log(`  near     ${label} ${id}.${k}: ref ${a} got ${b} (Δ ${d.toExponential(1)})`);
    }
}

const b = await launch();
console.log(BROWSER, b.version());
const ref = await load(b, "sq", HTML);
const pol = await load(b, "poly", HTML);
const both = await load(b, "both", HTML);
const bothOff = await load(b, "both", HTML, { run: false });

const steps = {
  initial: async () => {},
  "class toggle f1 p8->p12, s0 base->lightbase": (p) =>
    p.evaluate(() => {
      const e = document.getElementById("f1");
      e.classList.replace("p8", "p12");
      document.getElementById("s0").classList.replace("base", "lightbase");
      document.getElementById("c0").classList.replace("p8", "p12");
    }),
  "insert wrapper + new nested frame/surface": (p) =>
    p.evaluate(() => {
      const e = document.getElementById("f2");
      e.insertAdjacentHTML("afterbegin", '<div><div id=new1 class="f s p2 up6"></div></div>');
      document
        .getElementById("s1")
        .insertAdjacentHTML("beforeend", '<div id=new2 class="s dn10"></div>');
    }),
  "wrap existing subtree in a new frame": (p) =>
    p.evaluate(() => {
      const e = document.getElementById("fb"),
        w = document.createElement("div");
      w.className = "f p4";
      e.replaceWith(w);
      w.append(e);
    }),
  "inline style --_p on f3": (p) =>
    p.evaluate(() => {
      document.getElementById("f3").style.setProperty("--_p", "1px");
    }),
  ":hover on d0": async (p) => {
    await p.hover("#d0");
  },
  "hover away": async (p) => {
    await p.mouse.move(999, 790);
  },
  "viewport < 500px (media query)": (p) => p.setViewportSize({ width: 400, height: 800 }),
  "viewport back": (p) => p.setViewportSize({ width: 1000, height: 800 }),
  "remove f1 wrapper's child f2": (p) => p.evaluate(() => document.getElementById("f2").remove()),
};
IDS.push("new1", "new2");
for (const [name, fn] of Object.entries(steps)) {
  for (const p of [ref, pol, both, bothOff]) await fn(p);
  await Promise.all([ref, pol, both, bothOff].map(settle));
  const ids = IDS.filter((id) => true);
  const safe = (page) =>
    page.evaluate(
      (ids) =>
        Object.fromEntries(
          ids.map((id) => {
            const e = document.getElementById(id);
            if (!e) return [id, null];
            const c = getComputedStyle(e);
            return [id, { r: c.borderTopLeftRadius, p: c.paddingTop, bg: c.backgroundColor }];
          }),
        ),
      ids,
    );
  const [R, P, B, O] = await Promise.all([ref, pol, both, bothOff].map(safe));
  const live = IDS.filter((id) => R[id]);
  const strip = (o) =>
    Object.fromEntries(live.map((id) => [id, o[id] ?? { r: "missing", p: "", bg: "" }]));
  const before = bad;
  const saved = IDS.slice();
  IDS.length = 0;
  IDS.push(...live);
  compare(`[poly] ${name}`, strip(R), strip(P));
  compare(`[both] ${name}`, strip(R), strip(B));
  compare(`[both-off] ${name}`, strip(R), strip(O));
  IDS.length = 0;
  IDS.push(...saved);
  console.log(`${bad === before ? "ok  " : "FAIL"} ${name}`);
  if (name === "initial") {
    const pick = ["f1", "f2", "f3", "f4", "s0", "s1", "s2", "s3", "s4"];
    for (const id of pick)
      console.log(
        "   ",
        id.padEnd(3),
        "sq:",
        R[id].r.padEnd(7),
        R[id].bg.padEnd(34),
        "poly:",
        P[id].r.padEnd(7),
        P[id].bg,
      );
  }
}
console.log(
  `compared ${cmpCount} values, mismatches ${bad}, worst numeric delta ${worst.toExponential(2)}`,
);
console.log(
  "poly attribute on both (engine probe should leave it off):",
  await both.evaluate(() => document.documentElement.hasAttribute("data-cssints-poly")),
);
await b.close();
process.exit(bad ? 1 : 0);
