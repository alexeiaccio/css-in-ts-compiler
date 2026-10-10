// A slow mesh gradient behind the hero of the landing page (shaders, MIT, shaders.com): a canvas in the hero, from the page's bg to
// accentSoft, which the contrast checks of theme.ts keep readable under the text. Client only and lazy: Landing.tsx imports this
// module when the page is shown, and `shaders/js` is imported when the browser has WebGPU and no wish for less motion. Without them,
// or when the shader fails, the canvas goes and the hero's radial gradient (page.ts) stays, as it is under the canvas.
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import type { ShaderInstance } from "shaders/js";

// behind the hero's content (the hero isolates its stacking context), faded out at the edges like the glow under it
const layerClass: Style = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.zIndex(-1),
  css.pointerEvents("none"),
  css.maskImage("radial-gradient(ellipse closest-side at 50% 50%, #000 45%, transparent)"),
);
const canvasClass = css.cn(
  css.display("block"),
  css.width("100%"),
  css.height("100%"),
  css.opacity(0),
  css.transition("opacity 1.5s"),
);

const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;

/**
 * Puts the shader in `hero`.
 * @param {HTMLElement} hero the hero section of the landing page
 * @returns {() => void} what takes it out again (the page is left, or the hero is replaced)
 */
export function mount(hero: HTMLElement): () => void {
  if (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !(navigator as { gpu?: unknown }).gpu
  )
    return () => {};
  // the mask is on a layer: Chrome did not apply it to the WebGPU canvas itself
  const layer = document.createElement("div");
  layer.className = layerClass;
  layer.ariaHidden = "true";
  layer.dataset.shader = "";
  const canvas = layer.appendChild(document.createElement("canvas"));
  canvas.className = canvasClass;
  // the size stays the layer's: the shader would pin the pixels it measures
  canvas.style.width = canvas.style.height = "100%";
  hero.prepend(layer);

  // a token of the active palette and mode, as "#rrggbb" (the canvas converts whatever Chrome computes: oklch, color())
  const hex = (token: string) => {
    canvas.style.color = `var(${token})`;
    probe.fillStyle = getComputedStyle(canvas).color;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v!.toString(16).padStart(2, "0")).join("")}`;
  };
  // the stops: the component's own default is a loud five-colour ramp, and colorA and colorB only apply without stops
  const props = () => ({
    stops: [
      { color: hex("--color-bg"), position: 0 },
      { color: hex("--color-accent-soft"), position: 0.4 },
      { color: hex("--color-accent-soft"), position: 1 },
    ],
  });

  // the palette and the mode are classes and data attributes on <html>; the system's scheme is a media query
  let shader: ShaderInstance | undefined;
  const sync = () => shader?.update("mesh", props());
  const watching = new MutationObserver(sync);
  watching.observe(document.documentElement, { attributes: true });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", sync);
  let dead = false;
  void (async () => {
    const { createShader } = await import("shaders/js");
    const made = await createShader(
      canvas,
      {
        components: [
          { type: "MeshGradient", id: "mesh", props: { ...props(), speed: 0.3, swirl: 0.2 } },
        ],
      },
      {
        disableTelemetry: true,
        onReady: () => (canvas.style.opacity = "1"),
        onError: () => layer.remove(),
      },
    );
    if (dead) made.destroy();
    else shader = made;
  })().catch(() => layer.remove());

  return () => {
    dead = true;
    watching.disconnect();
    scheme.removeEventListener("change", sync);
    shader?.destroy();
    layer.remove();
  };
}
