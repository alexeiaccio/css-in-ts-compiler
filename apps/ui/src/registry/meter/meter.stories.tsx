// The meter's stories: a gauge is a track and the fill of the value in it. The fill's width is the one thing CSS cannot read
// off `aria-valuenow`, so it is an inline percentage from the same `percent()` the `aria-valuetext` is made of.
import type { Meta, Story } from "@cssints/stories";

import { Meter, type MeterProps } from "./meter.tsx";

const meta = {
  title: "Meter",
  component: Meter,
  args: { label: "Storage" },
  argTypes: {
    value: { type: "range", min: 0, max: 100, step: 1 },
  },
} satisfies Meta<MeterProps>;
export default meta;

export const Default: Story<MeterProps> = { args: { value: 64 } };

export const Full: Story<MeterProps> = { args: { value: 100 } };

// A value the numbers cannot say: `valueText` is what a reader hears instead of "92 percent".
export const WithValueText: Story<MeterProps> = {
  args: { label: "Upload", value: 92, valueText: "92% of the file sent" },
};
