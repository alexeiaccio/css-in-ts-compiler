/// <reference lib="dom" />
// The browser half of @cssints/stuck for targets without scroll-state queries: sets `data-stuck="top ..."` on each
// `sticky()` element while it is stuck, which the fallback rules of `stuck()` read. One IntersectionObserver per
// element, its root the nearest scroll container shrunk by the element's insets plus 1px (bramus/sticky-observer):
// stuck to an edge is past that edge of the shrunk root. Import it once in the app; it does nothing where the browser
// has scroll-state queries. No imports, no Effect.
const SIDES = ["top", "right", "bottom", "left"] as const;
const watched = new Map<Element, IntersectionObserver>();

const scroller = (el: Element) => {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
    if (/auto|scroll|hidden|overlay/.test(getComputedStyle(p).overflow)) return p;
  return null;
};

const watch = (el: Element) => {
  const s = getComputedStyle(el);
  const insets = SIDES.map((k) => s[k]);
  const io = new IntersectionObserver(
    ([e]) => {
      const r = e!.boundingClientRect;
      const b = e!.rootBounds;
      const past = b && [r.top < b.top, r.right > b.right, r.bottom > b.bottom, r.left < b.left];
      const on = SIDES.filter((_, i) => e!.isIntersecting && past?.[i] && insets[i] !== "auto");
      if (on.length) el.setAttribute("data-stuck", on.join(" "));
      else el.removeAttribute("data-stuck");
    },
    {
      root: scroller(el),
      rootMargin: insets.map((v) => (v === "auto" ? "0px" : `${-1 - parseFloat(v)}px`)).join(" "),
      threshold: [0, 1],
    },
  );
  io.observe(el);
  watched.set(el, io);
};

const scan = () => {
  for (const [el, io] of watched)
    if (!el.isConnected || !el.classList.contains("_stuck-core")) {
      io.disconnect();
      watched.delete(el);
      el.removeAttribute("data-stuck");
    }
  for (const el of document.querySelectorAll("._stuck-core")) if (!watched.has(el)) watch(el);
};

if (typeof document !== "undefined" && !CSS.supports("container-type", "scroll-state")) {
  scan();
  new MutationObserver(scan).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributeFilter: ["class"],
  });
}
