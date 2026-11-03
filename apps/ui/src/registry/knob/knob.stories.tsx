// The knob's stories: the primitive owns the value, the bounds, the step and the gesture, so a story is the props. The
// readout is `format`'s text — the one place the value is worded, for the eye and for `aria-valuetext` — and `size` only
// decides the dial's diameter, which the arc, the pointer and the readout are all sized from.
import type { Meta, Story } from "@cssints/stories";

import { Knob, type KnobProps } from "./knob.tsx";

const percent = (value: number): string => `${value}%`;

const meta = {
  title: "Knob",
  component: Knob,
  args: { label: "Volume", defaultValue: 65, min: 0, max: 100, step: 1, format: percent },
  argTypes: {
    label: { type: "text" },
    defaultValue: { type: "range", min: 0, max: 100, step: 1 },
    min: { type: "number" },
    max: { type: "number" },
    step: { type: "number" },
    size: { type: "select", options: ["4rem", "6rem", "8rem"] },
  },
} satisfies Meta<KnobProps>;
export default meta;

export const Default: Story<KnobProps> = {};

// A dial whose centre is its own word: the skin reads the primitive's `aria-valuetext`, so the readout and a screen
// reader say "Centre", not "0".
export const Pan: Story<KnobProps> = {
  args: {
    label: "Pan",
    min: -50,
    max: 50,
    step: 5,
    defaultValue: 0,
    format: (value) => (value === 0 ? "Centre" : value < 0 ? `${-value} L` : `${value} R`),
  },
};

// The same dial at 8rem: `size` is a CSS length and nothing else about the knob changes.
export const LargeDial: Story<KnobProps> = {
  name: "Large dial",
  args: { label: "Master", defaultValue: 80, size: "8rem" },
};
