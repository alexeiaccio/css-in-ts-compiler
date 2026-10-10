# @cssints/motion

Animation presets for [cssints](../../README.md): fade, slide, scale and blur, in and out, as one chain member of
`cssints/plugin` `scope()`. In the composable way of [tailwindcss-motion](https://github.com/romboHQ/tailwindcss-motion)
and [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate): a preset only sets custom properties, and
one kernel over `keyframes()` runs them. No runtime.

```ts
import { cn, hover } from "cssints" with { type: "cssints" };
import { motion } from "@cssints/motion" with { type: "cssints" };

export const toast = motion()
  .preset("slide-in-up")
  .duration("500ms")
  .delay("100ms")
  .easing("linear");
export const leave = motion().preset("fade-out");
export const slow = cn(motion().preset("scale-in"), hover(motion().duration("1s")));
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
  @keyframes kf-eaeb1c11 {
    to {
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
  @keyframes kf-9b622913 {
    to {
      opacity: var(--motion-o);
    }
  }
  ._motion-core {
    animation: var(--motion-n) var(--motion-d) var(--motion-e) var(--motion-l) both;
    --motion-in: kf-7f473efd;
    --motion-out: kf-eaeb1c11;
    --motion-ri: kf-4f766ef7;
    --motion-ro: kf-9b622913;
    --motion-n: none;
    --motion-r: none;
    --motion-d: 300ms;
    --motion-l: 0s;
    --motion-e: ease-out;
    --motion-o: 1;
    --motion-x: 0;
    --motion-y: 0;
    --motion-s: 1;
    --motion-b: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    ._motion-core {
      animation-name: var(--motion-r);
    }
  }
}
@layer _.a {
  ._13945js {
    --motion-n: var(--motion-in);
  }
  ._jddydc {
    --motion-r: var(--motion-ri);
  }
  ._knj5bv {
    --motion-o: 0;
  }
  ._1a9p5a9 {
    --motion-y: 25%;
  }
  ._46hkr9 {
    --motion-d: 500ms;
  }
  /* ... */
}
```

## Rules

- **Methods**, each once, in any order, all optional: `preset(name)`, `duration(<time [0s,∞]>)` (300ms),
  `delay(<time>)` (0s), `easing(<easing-function>)` (`ease-out`). Each is one class that sets a custom property, so a
  method works under a condition (`hover(motion().duration("1s"))`).
- **Presets**: `fade-in`, `fade-out`, `slide-in-up`, `slide-in-down`, `slide-in-left`, `slide-in-right`, `slide-out-up`,
  `slide-out-down`, `slide-out-left`, `slide-out-right`, `scale-in`, `scale-out`, `blur-in`, `blur-out`. Each fades; a
  slide moves 25% of the box, a scale starts (or ends) at 0.5, a blur at 5px (tailwindcss-motion's medium sizes). `-in`
  runs from those values to the element's own, `-out` from its own to those, and holds the end (`both`). `slide-in-up`
  moves up into place; `slide-out-up` moves up out of it.
- **The keyframes** are four `keyframes()`: in and out, and their reduced-motion twins that move only the opacity. They
  read `--motion-*`, so all presets share them. The kernel is written as styles and names them in `--motion-in`,
  `--motion-out`, `--motion-ri` and `--motion-ro` (`vars()`), which puts their rules in the sheet with it; a preset picks
  one (`--motion-n: var(--motion-in)`).
- **Reduced motion.** Under `prefers-reduced-motion: reduce` the kernel runs the opacity-only keyframes: a slide, scale or
  blur becomes a fade of the same duration, and `animationend` still fires.
- **No inheritance.** The kernel resets every `--motion-*` on its class, so a motion inside another one starts from its own
  preset, not its parent's.
- **Conflicts.** `motion()` sets the animation: a `cn()` that holds it and an `animation*` property is a build error,
  derived from the kernel: `cssints: motion: kernel core sets animation, animation-name (this style also sets animation-duration)`.
- **Errors** are the grammar's, in the types and at build time: `motion.preset: unexpected "spin" in "spin", expected
fade-in | ...`, `motion.duration: unexpected "-1s" in "-1s", expected <time [0s,∞]>`.
- **For other members.** `presets` (the table by name), `PresetName`, `motionKeyframes`, `motionVars` (the custom
  properties the keyframes read, by the field of a preset: `motionVars.y` is `--motion-y`) and `motionScope` (its kernel
  `core`) are exported, so a member built on these presets reuses them and never writes a `--motion-*` name.

## Limits

- One preset per element: `preset()` is used once, and presets do not stack (every slide, scale and blur already fades).
- The keyframes set `translate`, `scale` and `filter`: during the animation (and after an `-out` one) they replace the
  element's own; `transform` is untouched.
- No loop presets (pulse, spin, bounce), no spring easings, no per-preset sizes.

```bash
cd packages/motion && bun run test   # fixtures through the engine (output, conflicts, errors); bun run typecheck for the type test
```

## Credits

The design (presets that only set custom properties, one kernel over `keyframes()`), the preset names and the
medium sizes (25%, 0.5, 5px) follow [tailwindcss-motion](https://github.com/romboHQ/tailwindcss-motion) (MIT, Rombo
Limited) and [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) (MIT, Jamie Kyle). No code is
copied.
