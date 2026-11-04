// The donut's stories: the article's own traffic by region, and a two-slice chart where every band is large enough to read at
// a glance.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Donut, type DonutProps } from "./donut.tsx";

const REGIONS = [
  { label: "Europe", value: 38 },
  { label: "North America", value: 31 },
  { label: "Asia", value: 18 },
  { label: "South America", value: 8 },
  { label: "Oceania", value: 5 },
];

const meta = {
  title: "Donut",
  component: Donut,
  args: { slices: REGIONS, label: "Traffic by region, last 24 hours" },
  argTypes: {
    size: { type: "text" },
  },
} satisfies Meta<DonutProps>;
export default meta;

export const Traffic: Story<DonutProps> = {};

// Two slices: the ring has one cut, and the shares are the halves' own.
export const TwoSlices: Story<DonutProps> = {
  name: "Two slices",
  render: () => (
    <Donut
      label="Sign-ups by plan"
      slices={[
        { label: "Free", value: 820 },
        { label: "Paid", value: 180 },
      ]}
    />
  ),
};
