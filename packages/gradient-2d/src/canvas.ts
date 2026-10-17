/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The canvas half of @cssints/gradient-2d's runtime, shared by meshGradient() and freeformGradient(): the drawing at a
// quarter of the box (64 px at least), the blob URL and its revocation, the probe that resolves a `var()` colour, and the
// observers that draw on a size change or on an element that appears. Plain code, no Effect, no imports beyond the colour
// type; grid.ts and points.ts are the two rules that say what colour each pixel is.
import type { Quad } from "./grid.ts";

/** Writes the pixels of one drawing into `img`: the mesh's rule or the freeform one. */
export type Paint = (
  el: HTMLElement,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) => ImageData;

/** One drawing of the runtime: the class to look for, the custom property it writes, the native check and the rule. */
export type Drawing = { marker: string; fallback: string; native: string; paint: Paint };

const drawn = new WeakMap<HTMLElement, { id: number; url?: string }>();

// The colour a `var()` resolves to on this element: a hidden child inherits the custom properties, and a 1 x 1 canvas
// turns the computed colour into sRGB.
export const resolve = (el: HTMLElement, text: string, ctx: CanvasRenderingContext2D) => {
  const probe = document.createElement("span");
  probe.hidden = true;
  probe.style.color = text;
  el.append(probe);
  const css = getComputedStyle(probe).color;
  probe.remove();
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const px = ctx.getImageData(0, 0, 1, 1).data;
  return [px[0]! / 255, px[1]! / 255, px[2]! / 255, px[3]! / 255] satisfies Quad;
};

const draw = (el: HTMLElement, d: Drawing) => {
  if (!el.clientWidth || !el.clientHeight) return;
  const w = Math.max(64, Math.round(el.clientWidth / 4));
  const h = Math.max(64, Math.round(el.clientHeight / 4));
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(d.paint(el, ctx, w, h), 0, 0);
  const s = drawn.get(el) ?? { id: 0 };
  const id = ++s.id;
  drawn.set(el, s);
  cv.toBlob((blob) => {
    if (!blob || drawn.get(el)?.id !== id) return;
    if (s.url) URL.revokeObjectURL(s.url);
    s.url = URL.createObjectURL(blob);
    el.style.setProperty(d.fallback, `url("${s.url}")`);
  }, "image/png");
};

// One pair of observers for every drawing: each element is drawn by the rule of the marker class it holds, and only when
// the browser lacks that function.
export const run = (drawings: Drawing[]) => {
  const live = drawings.filter((d) => !CSS.supports("background-image", d.native));
  if (!live.length) return;
  // a size change, and the first observation of each element, draw it
  const sized = new ResizeObserver((es) => {
    for (const e of es) {
      const el = e.target as HTMLElement;
      for (const d of live) if (el.classList.contains(d.marker)) draw(el, d);
    }
  });
  const scan = (root: Element) => {
    for (const d of live)
      for (const el of root.matches(`.${d.marker}`)
        ? [root]
        : root.querySelectorAll(`.${d.marker}`))
        sized.observe(el);
  };
  // an element added, or given the marker's class later (a framework or a script sets it after this runs)
  new MutationObserver((rs) => {
    for (const r of rs)
      if (r.type === "attributes") scan(r.target as Element);
      else for (const n of r.addedNodes) if (n.nodeType === 1) scan(n as Element);
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  scan(document.documentElement);
};
