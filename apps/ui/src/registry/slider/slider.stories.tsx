// The slider's stories: a rail, a fill and the thumb the primitive announces as `role="slider"`. The orientation is the
// primitive's; a page sets a vertical rail's height.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { Slider } from "./slider.tsx";

const meta = { title: "Slider" } satisfies Meta;
export default meta;

export const Horizontal: Story = {
  render: () => {
    const [volume, setVolume] = createSignal(4);
    return <Slider label="Volume" value={volume()} onValueChange={setVolume} />;
  },
};

export const Vertical: Story = {
  render: () => (
    <div class="demo-row">
      <Slider label="Zoom" min={1} max={4} defaultValue={2} orientation="vertical" />
    </div>
  ),
};

// A range the host owns: two bounds and a step, as the primitive takes them.
export const Range: Story = {
  render: () => <Slider label="Opacity" min={0} max={100} step={10} defaultValue={50} />,
};
