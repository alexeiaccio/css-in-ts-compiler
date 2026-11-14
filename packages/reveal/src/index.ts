// @cssints/reveal: entrance animations on @cssints/motion's presets, and a scroll progress bar, as members of one
// scope. `reveal()` is scroll-driven: the kernel runs motion's `in` keyframes on `animation-timeline: view()` over
// `animation-range`, so the scroll scrubs the animation. `appear()` is scroll-triggered: `timeline-trigger` +
// `animation-trigger` decide *when* a time-based animation plays, so it keeps its own duration and easing and the scroll
// only starts it. A preset only sets the values the keyframes read. Where a target lacks the feature a member runs on, a
// runtime holds its animation paused (its CSS) until its script, ./runtime.ts, sees the element enter, then it plays once
// over its duration. `progress()` is the bar those entrances live under: the element's own scale, scrubbed by a scroll
// timeline. It has no fallback — a scrub cannot be played once, and a bar that lies is worse than none — so a browser
// without scroll-driven animations draws no bar; `createScrollProgress` (@cssints/headless) is the JS half for a bar
// that also has to be a `progressbar` to a screen reader.
import { motionKeyframes, motionVars, presets, type PresetName } from "@cssints/motion";
import { keyframes, scale } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

// The entrance presets of motion: an exit on scroll needs the native timeline, the fallback can only play on entry.
const names =
  "fade-in | slide-in-up | slide-in-down | slide-in-left | slide-in-right | scale-in | blur-in" as const;

// What a preset moves from, in motion's own custom properties (those its keyframes read).
const fields = Object.keys(motionVars) as (keyof typeof motionVars)[];
const emitPreset = (name: string) => {
  const p = presets[name as PresetName];
  return fields.flatMap((f) => {
    const v = p[f];
    return v === undefined ? [] : [[motionVars[f], v] as const];
  });
};

const supported = "animation-timeline:view()";

// The bar: a scale along the axis, from nothing to the whole element. A percentage would need the element's size in the
// keyframes; the scale is the one property a scroll timeline can scrub on the compositor.
const barX = keyframes({ from: scale("0 1"), to: scale("1 1") });
const barY = keyframes({ from: scale("1 0"), to: scale("1 1") });
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
  // `animation-trigger`, so it comes first. Under reduced motion only the opacity moves. It runs motion's keyframes and
  // sets motion's names, as `core` does; its own properties are its own short names, since two kernels of one scope may
  // not share one of theirs.
  "#enter": {
    css: (css) => [
      css.vars({
        "--_enter-k": motionKeyframes.in,
        "--_enter-rk": motionKeyframes.reducedIn,
        "--_enter-d": "300ms",
        "--_enter-e": "ease-out",
        "--_enter-g": "entry 100% exit 0%",
        "--_enter": "play-once",
        "--_leave": "none",
        [motionVars.opacity]: 0,
        [motionVars.x]: 0,
        [motionVars.y]: 0,
        [motionVars.scale]: 1,
        [motionVars.blur]: 0,
      }),
      css.animation("var(--_enter-k) var(--_enter-d) var(--_enter-e) both"),
      css.timelineTrigger("--_t view() var(--_enter-g)"),
      css.animationTrigger("--_t var(--_enter) var(--_leave)"),
      css.triggerScope("--_t"),
      css.media("(prefers-reduced-motion: reduce)")(css.animationName("var(--_enter-rk)")),
    ],
  },
  // the bar: the element's scale runs the scroll timeline, so the scroll's position is the bar's fill. `animation` comes
  // first (the shorthand resets `animation-timeline`); the axis switches the keyframes and with them the origin, since a
  // horizontal bar grows from its left edge and a vertical one from its top. Nothing covers the timeline's support
  // warning: without it nothing animates and the bar is simply not drawn, which is the truth a bar can tell.
  "#bar": {
    css: (css) => [
      css.vars({
        // both axes' keyframes ride in the kernel (a name a method emits carries no rule of its own), and the axis
        // switches which one the animation runs
        "--_p-x": barX,
        "--_p-y": barY,
        "--_p-k": "var(--_p-x)",
        "--_p-t": "scroll(root)",
        "--_p-g": "normal",
        "--_p-o": "0 50%",
      }),
      css.animation("var(--_p-k) linear both"),
      css.animationTimeline("var(--_p-t)"),
      css.animationRange("var(--_p-g)"),
      css.transformOrigin("var(--_p-o)"),
    ],
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
  progress: {
    uses: ["bar"],
    chain: {
      // the axis the bar fills along: `x` from the left edge, `y` from the top
      axis: {
        args: "x | y",
        emit: (v) =>
          v === "y"
            ? [
                ["--_p-k", "var(--_p-y)"],
                ["--_p-o", "50% 0"],
              ]
            : [
                ["--_p-k", "var(--_p-x)"],
                ["--_p-o", "0 50%"],
              ],
      },
      // the scrollport the bar reads: `scroll(root)` by default; `scroll(nearest)` inside a pane, `view()` for a bar
      // that fills while one element crosses the viewport, or a named `scroll-timeline` of an ancestor
      timeline: { args: "<'animation-timeline'>", emit: (v) => [["--_p-t", v]] },
      range: { args: "<'animation-range'>", emit: (v) => [["--_p-g", v]] },
    },
  },
  // the same methods, on the trigger's own names; `inOut()` is the one trigger action reveal() has no use for
  appear: {
    uses: ["enter", "io-appear"],
    chain: {
      preset: { args: names, emit: emitPreset },
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
 *
 * `progress().axis("y").timeline("scroll(nearest)").range("normal")`: a bar whose fill is the scroll's position — the
 * element's own `scale`, scrubbed by a scroll timeline (`scroll(root)` and `normal` by default, `x` from the left edge).
 * Size and colour it like any element (`block-size: 3px`, a background); it sets `animation*` and `transform-origin`, so
 * those in the same `cn()` are build errors, and it has no fallback: a browser without scroll-driven animations draws
 * nothing. Pair it with `createScrollProgress` (@cssints/headless) for the `progressbar` role and the JS fallback — one
 * element can carry both, the animation winning where it runs.
 */
export const { reveal, appear, progress } = revealScope.export();
