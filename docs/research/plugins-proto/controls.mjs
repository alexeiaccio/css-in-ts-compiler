/* oxlint-disable */
// Negative controls: the equivalence test must be able to fail.
import { FEATS, css, engine, launch, settle } from "./lib.mjs";
const html = `<div id=d0 class="f s w base r24 p8 b2 hov resp"><div id=d1 class="f s up6 p4"><div id=d2 class="f s up6 p4"></div></div></div>`;
const b = await launch();
const get = (p) =>
  p.evaluate(() =>
    ["d0", "d1", "d2"]
      .map((id) => {
        const c = getComputedStyle(document.getElementById(id));
        return `${c.borderTopLeftRadius} ${c.backgroundColor.slice(0, 22)}`;
      })
      .join(" | "),
  );
const mk = async (mode, js) => {
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  await p.setContent(`<style>${css[mode]}</style><body>${html}</body>`);
  if (js) await p.evaluate(js);
  await settle(p);
  return p;
};
const ref = await mk("sq");
const noJs = await mk("poly", () => document.documentElement.setAttribute("data-cssints-poly", ""));
const noEvents = await mk("poly");
await noEvents.addScriptTag({
  content: engine
    .replace('d.addEventListener("transitionrun"', 'void (0 && d.addEventListener("transitionrun"')
    .replace("update([root]);\n};", "update([root]);\n};")
    .replace("update([e.target]));", "update([e.target])));"),
});
await noEvents.evaluate((f) => window.__poly(f, true), FEATS);
await settle(noEvents);
console.log("initial     sq       :", await get(ref));
console.log("initial     no JS    :", await get(noJs));
console.log("initial     no events:", await get(noEvents));
for (const p of [ref, noEvents]) await p.hover("#d0");
await Promise.all([ref, noEvents].map(settle));
console.log("hover       sq       :", await get(ref));
console.log(
  "hover       no events:",
  await get(noEvents),
  "  <- stale without the transition sentinel",
);
await b.close();
