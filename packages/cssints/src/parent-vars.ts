/// <reference lib="dom" />
// The browser half of a parent-relative plugin (frame(), surface()) for targets without `@container style()`: copies
// the nearest marked ancestor's computed `read` custom property into `write` on each marked element. The plugin's CSS
// computes `read` from `write`. Imported only through `virtual:cssints/runtime/<name>`, never by the build; no imports,
// no Effect. One list of families and one MutationObserver, however many plugins call it.
// Prototype and measurements: docs/research/plugins-proto/engine.js, plugins.md §3.
interface Family {
  /** The class every element of the family carries (`_f`). */
  marker: string;
  /** The custom property read from the nearest marked ancestor, and written on the element. */
  read: string;
  write: string;
  /** A property that changes when a CSS condition (`:hover`, a media query) changes `read`: its transition re-runs us. */
  watch?: string;
}

const families: Family[] = [];
let started = false;
let observer: MutationObserver | undefined;

const update = (roots: Element[]) => {
  for (const f of families) {
    const s = `.${f.marker}`;
    const level = new Map<Element | null | undefined, number>();
    const rows: [Element, Element | null | undefined][][] = [];
    for (const r of roots)
      for (const el of r.matches(s) ? [r, ...r.querySelectorAll(s)] : r.querySelectorAll(s)) {
        const p = el.parentElement?.closest(s);
        const l = level.has(p) ? level.get(p)! + 1 : 0;
        level.set(el, l);
        (rows[l] ??= []).push([el, p]);
      }
    // one level at a time: the parents are read in one style recalculation, then the children written
    for (const row of rows) {
      const v = new Map(row.map(([, p]) => [p, p && getComputedStyle(p).getPropertyValue(f.read)]));
      for (const [el, p] of row)
        if (p) (el as HTMLElement).style.setProperty(f.write, v.get(p)!);
        else (el as HTMLElement).style.removeProperty(f.write);
    }
  }
  observer?.takeRecords();
};

// the top-most connected nodes of a list: updating one covers the others inside it
const top = (nodes: Node[]) => {
  const s = new Set(nodes);
  return [...s].filter((n) => {
    for (let a = n.parentNode; n.isConnected && a; a = a.parentNode) if (s.has(a)) return false;
    return n.isConnected;
  }) as Element[];
};

const start = (): void => {
  const root = document.documentElement;
  // The probe: a browser with style queries on custom properties needs nothing from us.
  const p = document.createElement("div");
  const c = document.createElement("i");
  const s = document.createElement("style");
  s.textContent = "@container style(--_q:1){i{--_h:1}}";
  p.style.setProperty("--_q", "1");
  p.append(c);
  document.head.append(s);
  root.append(p);
  const supported = getComputedStyle(c).getPropertyValue("--_h");
  p.remove();
  s.remove();
  if (supported) return;
  root.setAttribute("data-cssints-poly", "");
  observer = new MutationObserver((rs) =>
    update(
      top(
        rs.flatMap((r) =>
          r.type === "childList" ? [...r.addedNodes].filter((n) => n.nodeType === 1) : [r.target],
        ),
      ),
    ),
  );
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  document.addEventListener(
    "transitionrun",
    (e) => families.some((f) => f.watch === e.propertyName) && update([e.target as Element]),
  );
};

/** Adds families to the shared engine and runs it; the first call starts it (and does nothing in a browser that needs no help). */
export default (add: Family[]): void => {
  if (typeof document === "undefined") return;
  families.push(...add);
  if (!started) {
    started = true;
    start();
  }
  if (observer) update([document.documentElement]);
};
