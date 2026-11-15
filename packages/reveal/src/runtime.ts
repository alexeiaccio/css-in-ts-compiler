/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The fallback of reveal() and appear() for browsers without the feature each one runs on: reveal needs a view timeline,
// appear needs animation triggers. It marks <html data-reveal> (each member's fallback CSS then holds its animations
// paused at their first frame) and gives an element data-reveal-in when it enters the viewport, which plays it once. Off
// where the feature works: one script, a gate per feature. No imports, no Effect; the engine delivers it
// (virtual:cssints/runtime/reveal.io and virtual:cssints/runtime/reveal.io-appear) when a target lacks the feature.
//
// It is also the whole of pointer(), because no engine ships `pointer-timeline`: the fraction of an element the pointer has
// crossed, written to that element's own `scale`. That part is delivered to every target (the engine's `polyfills: []`).
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

// pointer(): no engine has `pointer-timeline`, so this is the feature and not a fallback. One listener on the document; the
// axis is the member's own `--reveal-pt-a`, the first move over an element starts its scrub, and it holds where the pointer
// left. The box the pointer is measured against is the **layout** one: the scrub shrinks the painted element, and a pointer
// past the painted edge is still on its way across the element — so the size comes from `offsetWidth`/`offsetHeight` and the
// fixed edge (the origin's) from the rect, and the element that was last scrubbed keeps receiving the moves its own scale
// would otherwise steal.
if (typeof CSS !== "undefined" && !CSS.supports("pointer-timeline: --x block")) {
  let active: HTMLElement | null = null;
  const scrub = (event: PointerEvent): void => {
    const target = event.target;
    const hit = target instanceof Element ? target.closest("._reveal-pt") : null;
    const element = hit instanceof HTMLElement ? hit : active;
    if (element === null) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.left + width &&
      event.clientY >= rect.top &&
      event.clientY <= rect.top + height;
    if (hit === null && !inside) {
      active = null;
      return;
    }
    active = element;
    const vertical = getComputedStyle(element).getPropertyValue("--reveal-pt-a").trim() === "y";
    const at = vertical ? (event.clientY - rect.top) / height : (event.clientX - rect.left) / width;
    const crossed = Math.min(1, Math.max(0, at));
    element.style.scale = vertical ? `1 ${crossed}` : `${crossed} 1`;
  };
  document.addEventListener("pointermove", scrub, { passive: true });
}

export {};
