// The checkbox group's stories: three boxes whose "all" state the primitive derives. The parent box is a tri-state the host
// asks for, and the group owns the checked set unless the page does.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { CheckboxGroup } from "./checkbox-group.tsx";

const meta = { title: "Checkbox group" } satisfies Meta;
export default meta;

export const Notifications: Story = {
  render: () => {
    const [channels, setChannels] = createSignal<ReadonlyArray<string>>(["email"]);
    return (
      <CheckboxGroup
        label="Notifications"
        values={["email", "push", "sms"]}
        value={channels()}
        onValueChange={setChannels}
        parent
        parentLabel="All channels"
      >
        {(channel) => channel}
      </CheckboxGroup>
    );
  },
};

// Without `parent` the group is the three boxes alone.
export const WithoutParent: Story = {
  name: "Without the parent box",
  render: () => (
    <CheckboxGroup label="Channels" values={["email", "push", "sms"]} defaultValue={["push"]}>
      {(channel) => channel}
    </CheckboxGroup>
  ),
};
