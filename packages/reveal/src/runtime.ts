/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The fallback of reveal() and appear() for browsers without the feature each one runs on: reveal needs a view timeline,
// appear needs animation triggers. It marks <html data-reveal> (each member's fallback CSS then holds its animations
// paused at their first frame) and gives an element data-reveal-in when it enters the viewport, which plays it once. Off
// where the feature works: one script, a gate per feature. No imports, no Effect; the engine delivers it
// (virtual:cssints/runtime/reveal.io and virtual:cssints/runtime/reveal.io-appear) when a target lacks the feature.
if (typeof CSS !== "undefined") {
  const timeline = !CSS.supports("animation-timeline:view()");
  const trigger = !CSS.supports("animation-trigger:none");
  if (timeline || trigger) {
    const root = document.documentElement;
    const marker = [timeline && "._reveal-core", trigger && "._reveal-enter"]
      .filter(Boolean)
      .join(",");
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
}

export {};
