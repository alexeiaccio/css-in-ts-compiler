// The checkbox's stories: a box, a check and the label beside it, in the two shapes the primitive has — on or off, and the
// tri-state the host asks for with `allowMixed`.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { Checkbox, type CheckboxProps } from "./checkbox.tsx";

const meta = {
  title: "Checkbox",
  component: Checkbox,
  args: { children: "Send me the changelog", defaultValue: "false" },
  argTypes: {
    disabled: { type: "boolean" },
    readOnly: { type: "boolean" },
  },
} satisfies Meta<CheckboxProps>;
export default meta;

export const Off: Story<CheckboxProps> = {};

export const On: Story<CheckboxProps> = { args: { defaultValue: "true" } };

export const Disabled: Story<CheckboxProps> = { args: { disabled: true } };

// The tri-state: `mixed` is announced as `aria-checked="mixed"`, and the box paints the dash instead of the tick.
export const Mixed: Story = {
  render: () => {
    const [checked, setChecked] = createSignal<"true" | "false" | "mixed">("mixed");
    return (
      <Checkbox allowMixed value={checked()} onValueChange={setChecked}>
        {checked() === "mixed" ? "Some items" : "All items"}
      </Checkbox>
    );
  },
};
