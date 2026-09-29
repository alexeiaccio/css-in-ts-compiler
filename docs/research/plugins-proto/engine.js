/* oxlint-disable */
// Runtime half of a parent-relative plugin (surface(), frame()) for targets without @container style().
// feats: [{ s: marker selector, r: property read from the nearest marked ancestor, w: property written on the
// element, t: sentinel property whose transitions signal a computed change }]. The plugin's CSS computes `r`
// from `w`; this script only copies the parent's `r` into `w`.
export default (feats, force) => {
  const d = document,
    root = d.documentElement;
  if (!force) {
    const p = d.createElement("div"),
      c = d.createElement("i"),
      s = d.createElement("style");
    s.textContent = "@container style(--_q:1){i{--_h:1}}";
    p.style.setProperty("--_q", "1");
    p.append(c);
    d.head.append(s);
    root.append(p);
    const ok = getComputedStyle(c).getPropertyValue("--_h");
    p.remove();
    s.remove();
    if (ok) return;
  }
  root.setAttribute("data-cssints-poly", "");

  const update = (roots) => {
    for (const f of feats) {
      const level = new Map(),
        rows = [];
      for (const r of roots)
        for (const el of r.matches(f.s)
          ? [r, ...r.querySelectorAll(f.s)]
          : r.querySelectorAll(f.s)) {
          const p = el.parentElement?.closest(f.s),
            l = level.has(p) ? level.get(p) + 1 : 0;
          level.set(el, l);
          (rows[l] ??= []).push([el, p]);
        }
      for (const row of rows) {
        const v = new Map(row.map(([, p]) => [p, p && getComputedStyle(p).getPropertyValue(f.r)]));
        for (const [el, p] of row)
          p ? el.style.setProperty(f.w, v.get(p)) : el.style.removeProperty(f.w);
      }
    }
    mo.takeRecords();
  };
  const top = (ns) => {
    const s = new Set(ns);
    return [...s].filter((n) => {
      for (let a = n.parentNode; n.isConnected && a; a = a.parentNode) if (s.has(a)) return false;
      return n.isConnected;
    });
  };
  const mo = new MutationObserver((rs) =>
    update(
      top(
        rs.flatMap((r) =>
          r.type === "childList" ? [...r.addedNodes].filter((n) => n.nodeType === 1) : [r.target],
        ),
      ),
    ),
  );
  mo.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  d.addEventListener(
    "transitionrun",
    (e) => feats.some((f) => f.t === e.propertyName) && update([e.target]),
  );
  update([root]);
};
