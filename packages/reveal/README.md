# @cssints/reveal

Entrance animations for [cssints](../../README.md), on [@cssints/motion](../motion/README.md)'s presets, as two chain
members of `cssints/plugin` `scope()`:

- **`reveal()`** is scroll-_driven_: an element runs the entrance as it scrolls into view, on `animation-timeline: view()`
  and `animation-range`, so the scroll scrubs it. In the spirit of
  [the supersonic plugin](https://github.com/the-illarionov/the-supersonic-plugin-for-scroll-based-animation) and
  [lax.js](https://github.com/alexfoxy/lax.js), with the browser doing the work.
- **`appear()`** is scroll-_triggered_: the scroll only decides _when_ a normal, time-based animation plays, on
  `timeline-trigger` + `animation-trigger`. It keeps its own duration and easing, so a slow scroll cannot stretch the
  entrance. The case is [utilitybend's article on CSS animation triggers](https://utilitybend.com/blog/scroll-triggered-animation-as-the-missing-piece-for-scrollytelling-on-the-web).

Where a target lacks the feature a member runs on, a 0.4 kB script plays the same animation once when the element enters.

```ts
import { cn, hover } from "cssints" with { type: "cssints" };
import { appear, reveal } from "@cssints/reveal" with { type: "cssints" };

// scroll-driven: the scroll scrubs it
export const fade = reveal();
export const card = reveal()
  .preset("slide-in-up")
  .range("entry 0% entry 100%")
  .duration("500ms")
  .easing("linear");
export const tile = cn(reveal().preset("blur-in"), hover(reveal().duration("1s")));

// scroll-triggered: it plays once on entry, with its own time
export const lede = appear().preset("slide-in-up").duration("600ms").easing("linear");
export const band = appear().preset("fade-in").inOut();
```

The CSS of `reveal()` (`fade` and `card` above):

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
    animation-range: var(--reveal-g);
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
    animation-timeline: view();
  }
  @media (prefers-reduced-motion: reduce) {
    ._reveal-core {
      animation-name: var(--reveal-rk);
    }
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

The CSS of `appear()` (`lede` and `band` above):

```css
@layer _.k {
  @keyframes kf-0d1310bc-reveal {
    from {
      opacity: var(--reveal-enter-o);
      translate: var(--reveal-enter-x) var(--reveal-enter-y);
      scale: var(--reveal-enter-s);
      filter: blur(var(--reveal-enter-b));
    }
  }
  @keyframes kf-af544ea2-reveal {
    from {
      opacity: var(--reveal-enter-o);
    }
  }
  ._reveal-enter {
    animation: var(--reveal-enter-k) var(--reveal-enter-d) var(--reveal-enter-e) both;
    timeline-trigger: --reveal-t view() var(--reveal-enter-g);
    --reveal-enter-k: kf-0d1310bc-reveal;
    --reveal-enter-rk: kf-af544ea2-reveal;
    --reveal-enter-d: 300ms;
    --reveal-enter-e: ease-out;
    --reveal-enter-g: entry 100% exit 0%;
    --reveal-enter: play-once;
    --reveal-leave: none;
    --reveal-enter-o: 0;
    --reveal-enter-x: 0;
    --reveal-enter-y: 0;
    --reveal-enter-s: 1;
    --reveal-enter-b: 0;
    animation-trigger: --reveal-t var(--reveal-enter) var(--reveal-leave);
    trigger-scope: --reveal-t;
  }
  @media (prefers-reduced-motion: reduce) {
    ._reveal-enter {
      animation-name: var(--reveal-enter-rk);
    }
  }
  /* only when a target lacks animation triggers */
  @supports not (animation-trigger: none) {
    [data-reveal] ._reveal-enter:not([data-reveal-in]) {
      animation-play-state: paused;
    }
  }
}
@layer _.a {
  ._5mnsmm {
    --reveal-enter: play-forwards;
  }
  ._67iv7r {
    --reveal-leave: play-backwards;
  }
  ._gqrxp1 {
    --reveal-enter-y: 25%;
  }
  ._oa1u6n {
    --reveal-enter-o: 0;
  }
  ._oflqj4 {
    --reveal-enter-e: linear;
  }
  ._rsl9nu {
    --reveal-enter-d: 600ms;
  }
}
```

## Rules

- **Methods**, each once, in any order, all optional: `preset(name)` (`fade-in`), `range(<'animation-range'>)`
  (`entry 0% cover 40%` for `reveal()`, `entry 100% exit 0%` for `appear()`), `duration(<time [0s,∞]>)` (300ms) and
  `easing(<easing-function>)` (`ease-out`). Each is one class that sets a custom property, so a method works under a
  condition.
- **`reveal()`.** Where the timeline is native, the range decides when the animation runs and the scroll drives it (back
  and forth); the duration and the easing shape the fallback's one play (the easing applies to the scrubbed progress too).
- **`appear()`.** The range is the _activation_ range of the trigger: the element is fully in at `entry 100%`, so the
  animation plays there and not while it is entering. The animation then runs over `duration()` with `easing()`, whatever
  the scroll does. The default actions are `play-once none`: it plays once and stays, which is what an entrance wants —
  and exactly what the fallback does. `inOut()` sets `play-forwards play-backwards`, so it plays back out when the
  element leaves (where the triggers are native).
- **Presets** are motion's entrance presets: `fade-in`, `slide-in-up`, `slide-in-down`, `slide-in-left`,
  `slide-in-right`, `scale-in`, `blur-in`. The `-out` ones are not: the fallback can only play when an element enters.
- **Reuse of motion.** `reveal()` names motion's `motionKeyframes.in` and `motionKeyframes.reducedIn`, so their rule
  is motion's kernel, printed once however many styles use it, and a preset sets the values those keyframes read, from
  motion's `presets` table under motion's names (`motionVars`). `appear()` reads the same `presets`, but it
  cannot run motion's keyframes rule: two kernels of one scope may not declare one custom property (the engine's rule),
  and motion's keyframes read `--motion-*`, which `reveal()`'s kernel declares too. So its kernel carries the same
  keyframes and values under names of its own (`--reveal-enter-*`), and the two members can sit on one page. Nothing is
  copied from motion but the values of its presets.
- **`trigger-scope` is required.** The trigger name is the kernel's (`--reveal-t`) and every element of the class shares
  it; without `trigger-scope: --reveal-t`, the last element in the document would drive every card. With it, two boxes
  of the same class trigger independently (checked in Chrome 156). Two different styles on one page do not collide
  either: each kernel has its own name.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` each kernel runs the opacity-only keyframes (motion's rule):
  a slide, scale or blur becomes a fade over the same range or trigger.
- **One kernel, written as styles.** The `animation` shorthand resets `animation-timeline` and `animation-trigger`; a
  kernel prints a shorthand before its longhands, so the declarations beside it win.
- **Conflicts.** `reveal()` and `appear()` set the animation: a `cn()` that holds one and an `animation*` property is a
  build error, derived from the kernel:
  `cssints: reveal: kernel enter sets animation, timeline-trigger, animation-trigger, trigger-scope, animation-name (this style also sets animation-duration)`.
- **Errors** are the grammar's, in the types and at build time: `reveal.preset: unexpected "fade-out" in "fade-out",
  expected fade-in | ...`, `appear.range: unexpected "sideways" in "entry 0% sideways"`.

## Browsers

- **Native.** `reveal()`: Chrome 115, Safari 26 (scroll-driven animations, `css.properties.animation-timeline` and
  `animation-range`); Firefox has them behind a flag only. `appear()`: Chrome 146, Edge 146, Opera 130
  (`css.properties.animation-trigger`, `timeline-trigger` and `trigger-scope`); Firefox and Safari have no animation
  triggers today. CSS animation triggers are a candidate for Interop 2027.
- **The fallback.** When a browserslist target lacks the feature a member runs on, the build adds that member's
  `@supports not` rule above to the sheet (it stays out of the sheet for targets that all have it), and the kernel's
  declarations give no support warning: the runtime polyfills them. The script, `@cssints/reveal/runtime`, comes with
  it: each runtime entry names it (`script`), so a module that uses `reveal()` imports it through
  `virtual:cssints/runtime/reveal.io` and one that uses `appear()` through `virtual:cssints/runtime/reveal.io-appear`;
  each is empty when every target has its feature. Nothing to import by hand.
- **One script, two gates.** In the browser the script does nothing where both features work. It gates on
  `CSS.supports("animation-timeline:view()")` for `reveal()` and `CSS.supports("animation-trigger:none")` for
  `appear()`: it marks `<html data-reveal>` (the rule then holds each fallback animation at its first frame) and an
  `IntersectionObserver` gives an element `data-reveal-in` when it enters the viewport, which plays the keyframes once,
  over `duration()`. A `MutationObserver` picks up elements added later. 605 bytes minified, 369 gzip; no imports.
- **The fallback equals `appear()`'s default.** Playing once on entry is exactly `play-once none`, so on Firefox and
  Safari `appear()` needs no extra behaviour; it cannot play back out (`inOut()`), follow the range, or react to the
  scroll.
- **Why not a polyfill.** [flackr's scroll-timeline polyfill](https://github.com/flackr/scroll-timeline) scrubs the
  animation as the native timeline does, but it is about 61 kB minified (17 kB gzip), rewrites stylesheets and runs on
  every scroll. An entrance is a one-shot: playing it once on entry is what most sites want, costs 1/50 of the bytes and
  nothing per scroll. The price is that the fallback is not scrubbed and ignores `range()`.
- Without the script, a target that lacks the feature plays the animation on load, as `motion()` would: nothing stays
  hidden.
- Tested in Chrome 156 (native triggers and the fallback forced), Firefox 157 (the fallback) and WebKit 27.2 (the
  reveal timeline native, the fallback for `appear()`): `bun run test:browsers`.

## Limits

- With targets that mix both (the default browserslist), the script ships to every browser and only probes where the
  feature is native.
- The fallback does not follow the range, the scroll direction or an element that leaves the viewport: it plays once. An
  element that gets the class after it is in the document (not added with it) is not seen.
- Until the script runs, an animation below the fold may start playing; it is paused where it is and resumes on entry.
  The script runs with the first module that uses `reveal()` or `appear()`.
- **`motion()` and `reveal()` cannot sit in one app.** Both kernels declare motion's custom properties (`--motion-o`
  and the rest), which the engine refuses: "a plugin picks its own short custom-property names". `appear()` has names of
  its own, so it can sit beside `motion()` (and beside `reveal()`).
- The trigger is on the animated element itself. A tall section that triggers its children is written by hand:
  `css.timelineTrigger()` and `css.animationTrigger()` on the section, and `css.animationTrigger()` on the child. A
  separate trigger element and a `.from("--name")` method are deferred.
- Entrance presets only, one per element; for an exit on scroll write the animation with `animationTimeline("view()")`
  and `animationRange("exit ...")` yourself.

```bash
cd packages/reveal && bun run test            # fixtures through the engine (output by targets, runtime modules, conflicts, errors)
cd packages/reveal && bun run test:browsers   # Chrome, Firefox and WebKit through playwright-core
```

## Credits

In the spirit of [the supersonic plugin](https://github.com/the-illarionov/the-supersonic-plugin-for-scroll-based-animation)
(MIT, Alex Illarionov) and [lax.js](https://github.com/alexfoxy/lax.js) (MIT, Alex Fox). The presets are
[@cssints/motion](../motion/README.md)'s. No code is copied.
