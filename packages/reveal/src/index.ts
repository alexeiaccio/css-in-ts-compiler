// @cssints/reveal: an entrance animation driven by scroll, on @cssints/motion's presets and keyframes. The kernel runs
// motion's `in` keyframes on `animation-timeline: view()` over `animation-range`; a preset only sets the `--motion-*`
// values those keyframes read. Where a target lacks scroll-driven animations, a runtime holds the animation paused (its
// CSS) until its script, ./runtime.ts, sees the element enter, then it plays once over its duration.
import { motionKeyframes, presets, type PresetName } from "@cssints/motion";
import { scope } from "cssints/plugin";

// The entrance presets of motion: an exit on scroll needs the native timeline, the fallback can only play on entry.
const names =
  "fade-in | slide-in-up | slide-in-down | slide-in-left | slide-in-right | scale-in | blur-in" as const;

// What a preset moves from, in motion's own custom properties (its keyframes read `--motion-*`).
const emitPreset = (name: string) => {
  const p = presets[name as PresetName];
  const set: [string, string | undefined][] = [
    ["--motion-o", p.opacity],
    ["--motion-x", p.x],
    ["--motion-y", p.y],
    ["--motion-s", p.scale],
    ["--motion-b", p.blur],
  ];
  return set.flatMap(([k, v]) => (v === undefined ? [] : [[k, v] as const]));
};

const supported = "animation-timeline:view()";

/** The scope of `reveal()`, for a scope that embeds it (its kernel `core`). */
export const revealScope = scope("reveal", {
  // motion's keyframes, fade-in by default, on the view timeline (after the `animation` shorthand, which resets it: the
  // kernel prints a shorthand before its longhands); under reduced motion only the opacity moves. The runtime below
  // covers the support warnings of the timeline.
  "#core": {
    css: (css) => [
      css.vars({
        "--_k": motionKeyframes.in,
        "--_rk": motionKeyframes.reducedIn,
        "--_d": "300ms",
        "--_e": "ease-out",
        "--_g": "entry 0% cover 40%",
        "--motion-o": 0,
        "--motion-x": 0,
        "--motion-y": 0,
        "--motion-s": 1,
        "--motion-b": 0,
      }),
      css.animation("var(--_k) var(--_d) var(--_e) both"),
      css.animationTimeline("view()"),
      css.animationRange("var(--_g)"),
      css.media("(prefers-reduced-motion: reduce)")(css.animationName("var(--_rk)")),
    ],
  },
  // without a view timeline the animation is time-based: held at its start until runtime.ts marks the element in view
  "#io": {
    polyfills: ["css.properties.animation-timeline", "css.properties.animation-range"],
    script: "@cssints/reveal/runtime",
    css: `@supports not (${supported}){[data-reveal] &:not([data-reveal-in]){animation-play-state:paused}}`,
  },
  reveal: {
    uses: ["core", "io"],
    chain: {
      preset: { args: names, emit: emitPreset },
      range: { args: "<'animation-range'>", emit: (v) => [["--_g", v]] },
      duration: { args: "<time [0s,∞]>", emit: (v) => [["--_d", v]] },
      easing: { args: "<easing-function>", emit: (v) => [["--_e", v]] },
    },
  },
});

/**
 * `reveal().preset("slide-in-up").range("entry 0% entry 100%").duration("500ms").easing("linear")`: motion's entrance
 * preset driven by the element's scroll into view, each method once and optional (`fade-in`, `entry 0% cover 40%`,
 * 300ms and `ease-out` for the fallback, which plays once on entry). Under `prefers-reduced-motion: reduce` only the
 * opacity moves. It sets the animation, so an `animation*` property in the same `cn()` is a build error.
 */
export const { reveal } = revealScope.export();
