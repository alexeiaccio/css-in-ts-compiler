# @cssints/reveal

Scroll-driven reveal animations for [cssints](../../README.md): an element runs one of
[@cssints/motion](../motion/README.md)'s entrance presets as it scrolls into view, on `animation-timeline: view()` and
`animation-range`, as one chain member of `cssints/plugin` `scope()`. In the spirit of
[the supersonic plugin](https://github.com/the-illarionov/the-supersonic-plugin-for-scroll-based-animation) and
[lax.js](https://github.com/alexfoxy/lax.js), with the browser doing the work. Where a target lacks scroll-driven
animations, a 0.3 kB script plays the same keyframes once when the element enters.

```ts
import { cn, hover } from "cssints" with { type: "cssints" };
import { reveal } from "@cssints/reveal" with { type: "cssints" };

export const fade = reveal();
export const card = reveal()
  .preset("slide-in-up")
  .range("entry 0% entry 100%")
  .duration("500ms")
  .easing("linear");
export const tile = cn(reveal().preset("blur-in"), hover(reveal().duration("1s")));
```

```css
@layer _.k {
  @keyframes kf-7f473efd {
    from {
      opacity: var(--motion-o);
      translate: var(--motion-x) var(--motion-y);
      scale: var(--motion-s);
      filter: blur(var(--motion-b));
    }
  }
  @keyframes kf-4f766ef7 {
    from {
      opacity: var(--motion-o);
    }
  }
  ._reveal-core {
    animation: var(--reveal-k) var(--reveal-d) var(--reveal-e) both;
    --reveal-k: kf-7f473efd;
    --reveal-rk: kf-4f766ef7;
    --reveal-d: 300ms;
    --reveal-e: ease-out;
    --reveal-g: entry 0% cover 40%;
    --motion-o: 0;
    --motion-x: 0;
    --motion-y: 0;
    --motion-s: 1;
    --motion-b: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    ._reveal-core {
      animation-name: var(--reveal-rk);
    }
  }
  ._reveal-view._reveal-view {
    animation-timeline: view();
    animation-range: var(--reveal-g);
  }
  /* only when a target lacks scroll-driven animations */
  @supports not (animation-timeline: view()) {
    [data-reveal] ._reveal-core:not([data-reveal-in]) {
      animation-play-state: paused;
    }
  }
}
@layer _.a {
  ._1a9p5a9 {
    --motion-y: 25%;
  }
  ._yorqor {
    --reveal-g: entry 0% entry 100%;
  }
  ._k4abtq {
    --reveal-d: 500ms;
  }
  /* ... */
}
```

## Rules

- **Methods**, each once, in any order, all optional: `preset(name)` (`fade-in`), `range(<'animation-range'>)`
  (`entry 0% cover 40%`), `duration(<time [0s,∞]>)` (300ms) and `easing(<easing-function>)` (`ease-out`). Each is one
  class that sets a custom property, so a method works under a condition. Where the timeline is native, the range
  decides when the animation runs and the scroll drives it (back and forth); the duration and the easing shape the
  fallback's one play (the easing applies to the scrubbed progress too).
- **Presets** are motion's entrance presets: `fade-in`, `slide-in-up`, `slide-in-down`, `slide-in-left`,
  `slide-in-right`, `scale-in`, `blur-in`. The `-out` ones are not: the fallback can only play when an element enters.
- **Reuse of motion.** The kernel names motion's `motionKeyframes.in` and `motionKeyframes.reducedIn`, which carries
  their rules (shared with `motion()` on the same page: one rule each), and a preset sets the `--motion-*` values those
  keyframes read, from motion's `presets` table. Nothing is copied.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` the kernel runs the opacity-only keyframes (motion's rule):
  a slide, scale or blur becomes a fade over the same range.
- **Two kernels.** The `animation` shorthand resets `animation-timeline` and `animation-range`, so they are in a kernel
  of their own whose selector is the class twice: it wins by specificity, whatever order the sheet gives the kernels.
- **Conflicts.** `reveal()` sets the animation: a `cn()` that holds it and an `animation*` property is a build error,
  derived from the kernel: `cssints: reveal: kernel core sets animation, animation-name (this style also sets animation-duration)`.
- **Errors** are the grammar's, in the types and at build time: `reveal.preset: unexpected "fade-out" in "fade-out",
expected fade-in | ...`, `reveal.range: unexpected "sideways" in "entry 0% sideways"`.

## Browsers

- **Native**: Chrome 115, Safari 26 (scroll-driven animations, `css.properties.animation-timeline` and
  `animation-range`). Firefox has them behind a flag only.
- **The fallback.** When a browserslist target lacks them, the build adds the `@supports not` rule above to the sheet
  (it stays out of the sheet for targets that all have them), and the kernel's `requires` gives no warning. The
  script, `@cssints/reveal/runtime`, comes with it: the runtime entry names it (`script`), so the module that uses
  `reveal()` imports it through `virtual:cssints/runtime/reveal.io`, which is empty when every target has the timeline.
  Nothing to import by hand. In the browser it does nothing where `CSS.supports("animation-timeline:view()")`; elsewhere it
  marks `<html data-reveal>` (the rule then holds each reveal at its first frame) and an `IntersectionObserver` gives an
  element `data-reveal-in` when it enters the viewport, which plays the keyframes once, over `duration()`. A
  `MutationObserver` picks up elements added later. 536 bytes minified, 319 gzip; no imports.
- **Why not a polyfill.** [flackr's scroll-timeline polyfill](https://github.com/flackr/scroll-timeline) scrubs the
  animation as the native timeline does, but it is about 61 kB minified (17 kB gzip), rewrites stylesheets and runs on
  every scroll. A reveal is an entrance: playing it once on entry is what most sites want, costs 1/50 of the bytes and
  nothing per scroll. The price is that the fallback is not scrubbed and ignores `range()`.
- Without the script, a target that lacks the timeline plays the animation on load, as `motion()` would: nothing stays
  hidden.
- Tested in Chrome 154 and WebKit 26.6 (native, and the fallback forced) and Firefox 155 (the fallback):
  `bun run test:browsers`.

## Limits

- With targets that mix both (the default browserslist), the script ships to every browser and only probes where the
  timeline is native.
- The fallback does not follow the range, the scroll direction or an element that leaves the viewport: it plays once. An
  element that gets the class after it is in the document (not added with it) is not seen.
- Until the script runs, a reveal below the fold may start playing; it is paused where it is and resumes on entry. The
  script runs with the first module that uses `reveal()`.
- Entrance presets only, one per element; for an exit on scroll write the animation with `animationTimeline("view()")`
  and `animationRange("exit ...")` yourself.

```bash
cd packages/reveal && bun run test            # fixtures through the engine (output by targets, runtime module, conflicts, errors)
cd packages/reveal && bun run test:browsers   # Chrome, Firefox and WebKit through playwright-core
```
