/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The fallback of reveal() for browsers without scroll-driven animations: marks <html data-reveal> (the fallback CSS then
// holds each reveal paused at its first frame) and gives an element data-reveal-in when it enters the viewport, which
// plays it once. Off where `animation-timeline: view()` works. No imports, no Effect; the engine delivers it
// (virtual:cssints/runtime/reveal.io) when a target lacks the timeline.
if (typeof CSS !== "undefined" && !CSS.supports("animation-timeline:view()")) {
  const root = document.documentElement;
  const marker = "._reveal-core";
  const io = new IntersectionObserver((entries) => {
    for (const e of entries)
      if (e.isIntersecting) {
        e.target.setAttribute("data-reveal-in", "");
        io.unobserve(e.target);
      }
  });
  const scan = (el: Element) => {
    if (el.matches(marker)) io.observe(el);
    for (const c of el.querySelectorAll(marker)) io.observe(c);
  };
  root.setAttribute("data-reveal", "");
  scan(root);
  new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) if (n instanceof Element) scan(n);
  }).observe(root, { childList: true, subtree: true });
}

export {};
