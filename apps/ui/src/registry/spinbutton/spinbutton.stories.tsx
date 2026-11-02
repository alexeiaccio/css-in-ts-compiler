// The spinbutton's stories: a text field with a stepper. At a bound the primitive announces the stepper as disabled and the
// kit paints and disables it, so a story is the two bounds.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { Field, FieldControl, FieldLabel, FieldMessage } from "../field/field.tsx";
import { Spinbutton } from "./spinbutton.tsx";

const meta = { title: "Spinbutton" } satisfies Meta;
export default meta;

export const InAField: Story = {
  name: "In a field",
  render: () => {
    const [quantity, setQuantity] = createSignal(3);
    return (
      <Field id="story-quantity" hint="Up to 12">
        <FieldLabel>Quantity</FieldLabel>
        <FieldControl
          render={(props) => (
            <Spinbutton
              {...props}
              min={1}
              max={12}
              value={quantity()}
              onValueChange={setQuantity}
            />
          )}
        />
        <FieldMessage />
      </Field>
    );
  },
};

export const AtTheBound: Story = {
  name: "At the bound",
  render: () => <Spinbutton aria-label="Copies" min={1} max={5} defaultValue={5} />,
};
