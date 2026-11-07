// The presets, and the grammar of their names, in a module with no cssints in it: `index.ts` makes the styles, and a
// reader that only needs the table (the native figures' `solid/specs/from-frames.ts`) imports this file without the
// engine. The names are one string, so the types reject a name that is not in it.

/** What a preset sets: the direction, and the opacity, translation, scale and blur it starts from (in) or ends at (out). */
export interface Preset {
  readonly dir: "in" | "out";
  readonly opacity?: string;
  readonly x?: string;
  readonly y?: string;
  readonly scale?: string;
  readonly blur?: string;
}

export const names =
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
