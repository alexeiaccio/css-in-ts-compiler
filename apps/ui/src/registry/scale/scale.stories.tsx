// The scale's stories: a bar list whose scale the browser works out. Add a value and the chart re-scales with no arithmetic
// in the page — the largest mark sizes the grid column and the bars divide by what was read back.
import type { Meta, Story } from "@cssints/stories";

import { Scale, type ScaleItem, type ScaleProps } from "./scale.tsx";

const REGIONS: ReadonlyArray<ScaleItem> = [
  { label: "us-east", value: 420 },
  { label: "eu-west", value: 310 },
  { label: "ap-south", value: 96 },
  { label: "sa-east", value: 42 },
];

const meta = {
  title: "Scale",
  component: Scale,
  args: { label: "Requests per second, by region", items: REGIONS },
} satisfies Meta<ScaleProps>;
export default meta;

export const Default: Story<ScaleProps> = {};

// One value is its own scale: the bar is full, and the number printed is that value.
export const Single: Story<ScaleProps> = {
  args: { label: "One region", items: [{ label: "us-east", value: 420 }] },
};

// A new largest value moves the scale: every other bar shrinks, and the printed number follows.
export const NewLargest: Story<ScaleProps> = {
  args: {
    label: "A fifth region",
    items: [...REGIONS, { label: "af-south", value: 900 }],
  },
};
