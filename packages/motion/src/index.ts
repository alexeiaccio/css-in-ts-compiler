// @cssints/motion: animation presets as one kernel over keyframes(), in the composable way of tailwindcss-motion and
// tailwindcss-animate. There are two keyframes for the motion (`in` starts from the values a preset sets, `out` ends at
// them) and two for reduced motion (opacity only); the kernel names them in custom properties, which carries their rules.
// A preset only sets custom properties: the keyframes to run and the start (or end) opacity, translation, scale and blur.
// The kernel resets those on its class, so a nested motion inherits nothing, and runs `animation` from them; under
// `prefers-reduced-motion: reduce` it runs the opacity-only keyframes.
import { cn, filter, keyframes, opacity, scale, translate } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

// The presets are in a module of their own (`./presets.ts`) so a reader with no cssints — the native figures' generator —
// can import the table and not the engine; the exports here are the package's, as before.
import { names, presets } from "./presets.ts";
import type { PresetName } from "./presets.ts";

export { presets } from "./presets.ts";
export type { Preset, PresetName } from "./presets.ts";

/**
 * The custom properties `motionKeyframes` read, by the field of a preset: the kernel's `--_o` is `--motion-o`. The full
 * names, so a keyframes name used in a style of its own (which carries the rule as written), or a scope that runs these
 * keyframes, reads and sets the same properties.
 */
export const motionVars = {
  opacity: "--motion-o",
  x: "--motion-x",
  y: "--motion-y",
  scale: "--motion-s",
  blur: "--motion-b",
} as const;

const v = motionVars;
const moved = cn(
  opacity(`var(${v.opacity})`),
  translate(`var(${v.x}) var(${v.y})`),
  scale(`var(${v.scale})`),
  filter(`blur(var(${v.blur}))`),
);
const faded = opacity(`var(${v.opacity})`);

/** The keyframes of each direction, and their reduced-motion twins (opacity only). */
export const motionKeyframes = {
  in: keyframes({ from: moved }),
  out: keyframes({ to: moved }),
  reducedIn: keyframes({ from: faded }),
  reducedOut: keyframes({ to: faded }),
};

const emitPreset = (name: string) => {
  const p = presets[name as PresetName];
  const set: [string, string | undefined][] = [
    ["--_n", p.dir === "in" ? "var(--_in)" : "var(--_out)"],
    ["--_r", p.dir === "in" ? "var(--_ri)" : "var(--_ro)"],
    ["--_o", p.opacity],
    ["--_x", p.x],
    ["--_y", p.y],
    ["--_s", p.scale],
    ["--_b", p.blur],
  ];
  return set.flatMap(([k, v]) => (v === undefined ? [] : [[k, v] as const]));
};

/** The scope of `motion()`, for a scope that embeds it (its kernel `core`). */
export const motionScope = scope("motion", {
  // the names of the keyframes, the defaults, and the animation over them: what it sets is its derived conflicts
  core: {
    css: (css) => [
      css.vars({
        "--_in": motionKeyframes.in,
        "--_out": motionKeyframes.out,
        "--_ri": motionKeyframes.reducedIn,
        "--_ro": motionKeyframes.reducedOut,
        "--_n": "none",
        "--_r": "none",
        "--_d": "300ms",
        "--_l": "0s",
        "--_e": "ease-out",
        "--_o": 1,
        "--_x": 0,
        "--_y": 0,
        "--_s": 1,
        "--_b": 0,
      }),
      css.animation("var(--_n) var(--_d) var(--_e) var(--_l) both"),
      css.media("(prefers-reduced-motion: reduce)")(css.animationName("var(--_r)")),
    ],
  },
  motion: {
    uses: ["core"],
    chain: {
      preset: { args: names, emit: emitPreset },
      duration: { args: "<time [0s,∞]>", emit: (v) => [["--_d", v]] },
      delay: { args: "<time>", emit: (v) => [["--_l", v]] },
      easing: { args: "<easing-function>", emit: (v) => [["--_e", v]] },
    },
  },
});

/**
 * `motion().preset("slide-in-up").duration("500ms").delay("100ms").easing("ease-out")`: an animation from a preset, each
 * method once and optional (300ms, no delay, `ease-out`). Under `prefers-reduced-motion: reduce` only the opacity moves.
 * It sets the animation, so an `animation*` property in the same `cn()` is a build error.
 */
export const { motion } = motionScope.export();
