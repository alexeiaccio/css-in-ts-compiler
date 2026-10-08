/// <reference lib="dom" />
// The browser half of @cssints/stuck for targets without scroll-state queries: sets `data-stuck="top ..."` on each
// `sticky()` element while it is stuck, which the fallback rules of `stuck()` read. One IntersectionObserver per
// element, its root the nearest scroll container shrunk by the element's insets plus 1px (bramus/sticky-observer):
// stuck to an edge is past that edge of the shrunk root. virtual:cssints/runtime/stuck.observer imports it when a target
// lacks scroll-state queries; it does nothing where the browser has them. No imports, no Effect.
const SIDES = ["top", "right", "bottom", "left"] as const;
const watched = new Map<Element, IntersectionObserver>();

// the nearest ancestor below <body> that clips its overflow (the scroll container), else null: the viewport
const scroller = (el: Element) => {
  const up = [el];
  while (up.at(-1)!.parentElement) up.push(up.at(-1)!.parentElement!);
  return (
    up.slice(1, -2).find((p) => /auto|scroll|hidden|overlay/.test(getComputedStyle(p).overflow)) ??
    null
  );
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
