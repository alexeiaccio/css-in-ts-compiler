// The radio group's stories: one checked value, arrows move and check. The group is vertical or horizontal, and the skin
// paints the ring from the primitive's focus state.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { RadioGroup } from "./radio.tsx";

const meta = { title: "Radio" } satisfies Meta;
export default meta;

export const Vertical: Story = {
  render: () => {
    const [value, setValue] = createSignal("standard");
    return (
      <RadioGroup
        values={["standard", "express", "pickup"]}
        value={value()}
        onValueChange={setValue}
        orientation="vertical"
      >
        {(option) => option}
      </RadioGroup>
    );
  },
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup values={["day", "week", "month"]} defaultValue="week" orientation="horizontal">
      {(option) => option}
    </RadioGroup>
  ),
};
