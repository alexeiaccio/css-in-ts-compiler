// @cssints/reveal: entrance animations on @cssints/motion's presets, as two members of one scope. `reveal()` is
// scroll-driven: the kernel runs motion's `in` keyframes on `animation-timeline: view()` over `animation-range`, so the
// scroll scrubs the animation. `appear()` is scroll-triggered: `timeline-trigger` + `animation-trigger` decide *when* a
// time-based animation plays, so it keeps its own duration and easing and the scroll only starts it. A preset only sets
// the values the keyframes read. Where a target lacks the feature a member runs on, a runtime holds its animation paused
// (its CSS) until its script, ./runtime.ts, sees the element enter, then it plays once over its duration.
import { motionKeyframes, motionVars, presets, type PresetName } from "@cssints/motion";
import { scope } from "cssints/plugin";

// The entrance presets of motion: an exit on scroll needs the native timeline, the fallback can only play on entry.
const names =
  "fade-in | slide-in-up | slide-in-down | slide-in-left | slide-in-right | scale-in | blur-in" as const;

// What a preset moves from, in the custom properties its keyframes read.
const fields = Object.keys(motionVars) as (keyof typeof motionVars)[];
const presetEmit = (vars: Readonly<Record<keyof typeof motionVars, string>>) => (name: string) => {
  const p = presets[name as PresetName];
  return fields.flatMap((f) => {
    const v = p[f];
    return v === undefined ? [] : [[vars[f], v] as const];
  });
};
// reveal() runs motion's own keyframes, so it sets motion's names. appear() cannot: two kernels of one scope may not
// declare one custom property, so its kernel carries the same keyframes and values under names of its own.
const emitPreset = presetEmit(motionVars);
const entered = {
  opacity: "--_enter-o",
  x: "--_enter-x",
  y: "--_enter-y",
  scale: "--_enter-s",
  blur: "--_enter-b",
} as const;
const emitEntered = presetEmit(entered);

const supported = "animation-timeline:view()";
const triggers = "animation-trigger:none";

/** The scope of `reveal()` and `appear()`, for a scope that embeds it (their kernels `core` and `enter`). */
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
        [motionVars.opacity]: 0,
        [motionVars.x]: 0,
        [motionVars.y]: 0,
        [motionVars.scale]: 1,
        [motionVars.blur]: 0,
      }),
      css.animation("var(--_k) var(--_d) var(--_e) both"),
      css.animationTimeline("view()"),
      css.animationRange("var(--_g)"),
      css.media("(prefers-reduced-motion: reduce)")(css.animationName("var(--_rk)")),
    ],
  },
  // the same entrance, but time-based: a view timeline names the trigger (`--_t`), which plays the animation on entry
  // and leaves it at its end frame. `trigger-scope` keeps the name to this element: without it every element of the class
  // shares one trigger and the last one in the document drives them all. The `animation` shorthand resets
  // `animation-trigger`, so it comes first. Under reduced motion only the opacity moves. Its own custom-property names:
  // `core` already declares motion's, and two kernels may not declare one property.
  "#enter": {
    css: (css) => {
      const moved = css.cn(
        css.opacity("var(--_enter-o)"),
        css.translate("var(--_enter-x) var(--_enter-y)"),
        css.scale("var(--_enter-s)"),
        css.filter("blur(var(--_enter-b))"),
      );
      const faded = css.opacity("var(--_enter-o)");
      return [
        css.vars({
          "--_enter-k": css.keyframes({ from: moved }),
          "--_enter-rk": css.keyframes({ from: faded }),
          "--_enter-d": "300ms",
          "--_enter-e": "ease-out",
          "--_enter-g": "entry 100% exit 0%",
          "--_enter": "play-once",
          "--_leave": "none",
          "--_enter-o": 0,
          "--_enter-x": 0,
          "--_enter-y": 0,
          "--_enter-s": 1,
          "--_enter-b": 0,
        }),
        css.animation("var(--_enter-k) var(--_enter-d) var(--_enter-e) both"),
        css.timelineTrigger("--_t view() var(--_enter-g)"),
        css.animationTrigger("--_t var(--_enter) var(--_leave)"),
        css.triggerScope("--_t"),
        css.media("(prefers-reduced-motion: reduce)")(css.animationName("var(--_enter-rk)")),
      ];
    },
  },
  // without a view timeline the animation is time-based: held at its start until runtime.ts marks the element in view
  "#io": {
    polyfills: ["css.properties.animation-timeline", "css.properties.animation-range"],
    script: "@cssints/reveal/runtime",
    css: `@supports not (${supported}){[data-reveal] &:not([data-reveal-in]){animation-play-state:paused}}`,
  },
  // without animation triggers the animation is time-based too: the same fallback, on its own feature
  "#io-appear": {
    polyfills: [
      "css.properties.animation-trigger",
      "css.properties.timeline-trigger",
      "css.properties.trigger-scope",
    ],
    script: "@cssints/reveal/runtime",
    css: `@supports not (${triggers}){[data-reveal] &:not([data-reveal-in]){animation-play-state:paused}}`,
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
  // the same methods, on the trigger's own names; `inOut()` is the one trigger action reveal() has no use for
  appear: {
    uses: ["enter", "io-appear"],
    chain: {
      preset: { args: names, emit: emitEntered },
      range: { args: "<'animation-range'>", emit: (v) => [["--_enter-g", v]] },
      duration: { args: "<time [0s,∞]>", emit: (v) => [["--_enter-d", v]] },
      easing: { args: "<easing-function>", emit: (v) => [["--_enter-e", v]] },
      inOut: {
        args: "",
        emit: () => [
          ["--_enter", "play-forwards"],
          ["--_leave", "play-backwards"],
        ],
      },
    },
  },
});

/**
 * `reveal().preset("slide-in-up").range("entry 0% entry 100%").duration("500ms").easing("linear")`: motion's entrance
 * preset driven by the element's scroll into view, each method once and optional (`fade-in`, `entry 0% cover 40%`,
 * 300ms and `ease-out` for the fallback, which plays once on entry). Under `prefers-reduced-motion: reduce` only the
 * opacity moves. It sets the animation, so an `animation*` property in the same `cn()` is a build error.
 *
 * `appear().preset("slide-in-up").duration("600ms").easing("linear")`: motion's entrance preset triggered by the
 * element's scroll into view, each method once and optional (`fade-in`, `entry 100% exit 0%`, 300ms and `ease-out`).
 * The scroll only starts the animation: it keeps its own duration and easing. `inOut()` plays it forwards on entry and
 * backwards on exit, where the triggers are native; the default plays it once and stays. Under
 * `prefers-reduced-motion: reduce` only the opacity moves. It sets the animation, so an `animation*` property in the
 * same `cn()` is a build error.
 */
export const { reveal, appear } = revealScope.export();
