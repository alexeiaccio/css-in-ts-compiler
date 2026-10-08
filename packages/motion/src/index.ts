// @cssints/motion: animation presets as one kernel over keyframes(), in the composable way of tailwindcss-motion and
// tailwindcss-animate. There are two keyframes for the motion (`in` starts from the values a preset sets, `out` ends at
// them) and two for reduced motion (opacity only); the kernel names them in custom properties, which carries their rules.
// A preset only sets custom properties: the keyframes to run and the start (or end) opacity, translation, scale and blur.
// The kernel resets those on its class, so a nested motion inherits nothing, and runs `animation` from them; under
// `prefers-reduced-motion: reduce` it runs the opacity-only keyframes.
import { cn, filter, keyframes, opacity, scale, translate } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

/** What a preset sets: the direction, and the opacity, translation, scale and blur it starts from (in) or ends at (out). */
export interface Preset {
  readonly dir: "in" | "out";
  readonly opacity?: string;
  readonly x?: string;
  readonly y?: string;
  readonly scale?: string;
  readonly blur?: string;
}

// The presets, as the grammar of `preset()`: one string, so the types reject a name that is not in it.
const names =
  "fade-in | fade-out | slide-in-up | slide-in-down | slide-in-left | slide-in-right | slide-out-up | slide-out-down | slide-out-left | slide-out-right | scale-in | scale-out | blur-in | blur-out" as const;
type Alternatives<S extends string> = S extends `${infer A} | ${infer R}` ? A | Alternatives<R> : S;

/** A preset's name. */
export type PresetName = Alternatives<typeof names>;

// tailwindcss-motion's medium sizes: a slide moves 25% of the box, a scale starts at half, a blur at 5px; all fade.
const slide = "25%";

/** The presets by name, for `motion().preset(name)` and the members built on them. */
export const presets: Readonly<Record<PresetName, Preset>> = {
  "fade-in": { dir: "in", opacity: "0" },
  "fade-out": { dir: "out", opacity: "0" },
  "slide-in-up": { dir: "in", opacity: "0", y: slide },
  "slide-in-down": { dir: "in", opacity: "0", y: `-${slide}` },
  "slide-in-left": { dir: "in", opacity: "0", x: slide },
  "slide-in-right": { dir: "in", opacity: "0", x: `-${slide}` },
  "slide-out-up": { dir: "out", opacity: "0", y: `-${slide}` },
  "slide-out-down": { dir: "out", opacity: "0", y: slide },
  "slide-out-left": { dir: "out", opacity: "0", x: `-${slide}` },
  "slide-out-right": { dir: "out", opacity: "0", x: slide },
  "scale-in": { dir: "in", opacity: "0", scale: "0.5" },
  "scale-out": { dir: "out", opacity: "0", scale: "0.5" },
  "blur-in": { dir: "in", opacity: "0", blur: "5px" },
  "blur-out": { dir: "out", opacity: "0", blur: "5px" },
};

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
