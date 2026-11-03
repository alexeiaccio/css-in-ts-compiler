// The two-thumb slider's stories: a range a price filter sets, the two thumbs never crossing and the fill between them. The
// primitive owns the keys, the bounds and the pair; the skin draws the rail.
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { SliderMultithumb } from "./slider-multithumb.tsx";

const meta = {
  title: "Slider (two thumbs)",
  args: { label: "Price", defaultValue: [3, 7] as const },
  argTypes: {
    disabled: { type: "boolean" },
  },
} satisfies Meta<{ label: string; defaultValue: readonly [number, number]; disabled?: boolean }>;
export default meta;

export const Range: Story<{ label: string; defaultValue: readonly [number, number]; disabled?: boolean }> = {
  render: (args) => (
    <div class="demo-column">
      <SliderMultithumb
        label={args.label}
        defaultValue={[args.defaultValue[0], args.defaultValue[1]]}
        disabled={args.disabled}
      />
      <p class="demo-text">
        Each thumb is a `role="slider"` of its own: Tab reaches the first, Tab again the second, and neither passes the other.
      </p>
    </div>
  ),
};

// The same pair the host owns: the two numbers a page saves.
export const Controlled: Story = {
  render: () => {
    const [range, setRange] = createSignal<readonly [number, number]>([2, 6]);
    return (
      <div class="demo-column">
        <SliderMultithumb
          label="Price"
          value={[range()[0], range()[1]]}
          onValueChange={(next) => setRange([next[0], next[1]])}
        />
        <p class="demo-text">{`from ${range()[0]} to ${range()[1]}`}</p>
      </div>
    );
  },
};

export const Vertical: Story = {
  render: () => (
    <div class="demo-row">
      <SliderMultithumb label="Window" defaultValue={[4, 9]} orientation="vertical" />
    </div>
  ),
};
