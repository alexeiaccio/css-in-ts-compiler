// The select's stories: a combobox whose listbox the primitive owns — typeahead, the active option, the commit. The trigger
// shows the chosen label, or the placeholder while nothing is chosen.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { Select, SelectContent, SelectTrigger } from "./select.tsx";

const meta = { title: "Select" } satisfies Meta;
export default meta;

export const Chosen: Story = {
  render: () => {
    const [value, setValue] = createSignal(1);
    return (
      <Select
        items={["Apple", "Banana", "Cherry", { label: "Durian" }]}
        value={value()}
        onValueChange={setValue}
        label="Fruit"
      >
        <SelectTrigger />
        <SelectContent />
      </Select>
    );
  },
};

// Nothing chosen: the trigger shows the placeholder, and the first arrow picks the first option.
export const Empty: Story = {
  render: () => (
    <Select items={["Small", "Medium", "Large"]} label="Size" placeholder="Pick a size">
      <SelectTrigger />
      <SelectContent />
    </Select>
  ),
};
