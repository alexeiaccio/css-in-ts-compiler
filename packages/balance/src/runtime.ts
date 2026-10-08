/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The fallback of balance() for browsers without `text-wrap: balance`, in the way of nytimes/text-balancer and
// react-wrap-balancer: the narrowest `max-width` that keeps the element's line count, found by a binary search, again
// when its parent resizes or its text changes. It acts only on an element whose computed `--balance-js` is set: the
// fallback CSS sets it in `@supports not (text-wrap:balance)`, and only when a browserslist target lacks the feature.
// Imported by the app (`import "@cssints/balance/runtime"`); no imports, no Effect.
const MARKER = "_balance-core";
const FLAG = "--balance-js";

const balance = (el: HTMLElement): void => {
  const s = el.style;
  s.maxWidth = "";
  if (!getComputedStyle(el).getPropertyValue(FLAG)) return;
  const h = el.clientHeight;
  s.whiteSpace = "nowrap";
  const one = el.clientHeight === h;
  s.whiteSpace = "";
  if (one) return;
  // the width max-width compares against (the same box-sizing), between half of it and all of it
  let hi = parseFloat(getComputedStyle(el).width);
  let lo = hi / 2;
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2;
    s.maxWidth = `${mid}px`;
    if (el.clientHeight === h) hi = mid;
    else lo = mid;
  }
  s.maxWidth = `${Math.ceil(hi)}px`;
};

const start = (): void => {
  const parents = new WeakSet<Element>();
  const resized = new ResizeObserver((es) => {
    for (const e of es)
      for (const el of e.target.children)
        if (el.classList.contains(MARKER)) balance(el as HTMLElement);
  });
  const scan = (root: Element): void => {
    for (const el of root.matches(`.${MARKER}`) ? [root] : root.querySelectorAll(`.${MARKER}`)) {
      const p = el.parentElement;
      if (p && !parents.has(p)) {
        parents.add(p);
        resized.observe(p);
      } else balance(el as HTMLElement);
    }
  };
  new MutationObserver((rs) => {
    for (const r of rs) {
      const t = r.target.nodeType === 1 ? (r.target as Element) : r.target.parentElement;
      const el = t?.closest(`.${MARKER}`);
      if (el) balance(el as HTMLElement);
      for (const n of r.addedNodes) if (n.nodeType === 1) scan(n as Element);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  scan(document.documentElement);
  void document.fonts?.ready.then(() => scan(document.documentElement));
};

if (typeof document !== "undefined") start();

export {};
