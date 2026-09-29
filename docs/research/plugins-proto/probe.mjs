/* oxlint-disable */
// The unsupported path of the probe: a browser without style queries parses the rule (general-enclosed) but never
// matches it. An unknown query function behaves the same way, so it stands in for Firefox < 151 / Safari < 18.
import { BROWSER, launch } from "./lib.mjs";
const probe = (q) => {
  const d = document,
    p = d.createElement("div"),
    c = d.createElement("i"),
    s = d.createElement("style");
  s.textContent = `@container ${q}(--_q:1){i{--_h:1}}`;
  p.style.setProperty("--_q", "1");
  p.append(c);
  d.head.append(s);
  d.documentElement.append(p);
  const t = performance.now(),
    ok = getComputedStyle(c).getPropertyValue("--_h"),
    dt = performance.now() - t;
  p.remove();
  s.remove();
  return { ok, ms: +dt.toFixed(2) };
};
const b = await launch();
const page = await b.newPage();
await page.setContent("<body></body>");
for (const q of ["style", "nostyle"])
  console.log(
    BROWSER,
    b.version(),
    `@container ${q}(...) ->`,
    JSON.stringify(await page.evaluate(probe, q)),
  );
await b.close();
