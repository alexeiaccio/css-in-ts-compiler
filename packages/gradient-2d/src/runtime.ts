/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The fallback of meshGradient() where the browser has no mesh-gradient(): the mesh drawn on a canvas, at a quarter of
// the box (64 px at least), set as the element's --gradient2d-fallback (a blob URL the kernel's background-image reads).
// A resize draws again; an element added later, or given the marker's class later, is observed and drawn. The maths is
// grid.ts's: this package's bicubic in oklab, not the spec's tensor-product patch. Plain code, no Effect; off where
// CSS.supports says the function is native.
import { fromSpace, sample, toSpace, type Quad, type Space } from "./grid.ts";

const MARKER = "_gradient2d-core";
const DATA = "--gradient2d-data";
const FALLBACK = "--gradient2d-fallback";
const drawn = new WeakMap<HTMLElement, { id: number; url?: string }>();

// The colour a `var()` resolves to on this element: a hidden child inherits the custom properties, and a 1 x 1 canvas
// turns the computed colour into sRGB.
const resolve = (el: HTMLElement, text: string, ctx: CanvasRenderingContext2D) => {
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

const draw = (el: HTMLElement) => {
  if (!el.clientWidth || !el.clientHeight) return;
  const w = Math.max(64, Math.round(el.clientWidth / 4));
  const h = Math.max(64, Math.round(el.clientHeight / 4));
  const raw = getComputedStyle(el).getPropertyValue(DATA).trim();
  const { space, rows } = JSON.parse(JSON.parse(raw) as string) as {
    space: Space;
    rows: (number[] | string)[][];
  };
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const grid = rows.map((row) =>
    row.map((s) => toSpace(space, typeof s === "string" ? resolve(el, s, ctx) : (s as Quad))),
  );
  const img = ctx.createImageData(w, h);
  Array.from({ length: w * h }, (_, i) => i).forEach((i) => {
    const q = fromSpace(space, sample(grid, ((i % w) + 0.5) / w, (Math.floor(i / w) + 0.5) / h));
    img.data.set([q[0] * 255, q[1] * 255, q[2] * 255, q[3] * 255], 4 * i);
  });
  ctx.putImageData(img, 0, 0);
  const s = drawn.get(el) ?? { id: 0 };
  const id = ++s.id;
  drawn.set(el, s);
  cv.toBlob((blob) => {
    if (!blob || drawn.get(el)?.id !== id) return;
    if (s.url) URL.revokeObjectURL(s.url);
    s.url = URL.createObjectURL(blob);
    el.style.setProperty(FALLBACK, `url("${s.url}")`);
  }, "image/png");
};

const start = () => {
  if (CSS.supports("background-image", "mesh-gradient(red, blue; green, yellow)")) return;
  // a size change, and the first observation of each element, draw it
  const sized = new ResizeObserver((es) => {
    for (const e of es) draw(e.target as HTMLElement);
  });
  const scan = (root: Element) => {
    for (const el of root.matches(`.${MARKER}`) ? [root] : root.querySelectorAll(`.${MARKER}`))
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

if (typeof document !== "undefined" && typeof ResizeObserver !== "undefined") start();
