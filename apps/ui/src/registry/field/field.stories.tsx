// The field's stories: a label, a control and the message under it, wired by ids the field owns. `hint` describes, `error`
// marks invalid and announces itself, and `required` reaches the control.
import type { Meta, Story } from "@cssints/stories";

import { Input } from "../input/input.tsx";
import { Field, FieldControl, FieldLabel, FieldMessage } from "./field.tsx";

const meta = { title: "Field" } satisfies Meta;
export default meta;

export const Hint: Story = {
  render: () => (
    <Field id="story-email" hint="We never share it">
      <FieldLabel>Email</FieldLabel>
      <FieldControl
        render={(props) => <Input {...props} type="email" placeholder="you@example.com" />}
      />
    </Field>
  ),
};

// `error` is the message and the invalid state in one prop: the control wears `aria-invalid` and the message is announced.
export const Error: Story = {
  render: () => (
    <Field id="story-name" error="A name is required" required>
      <FieldLabel>Name</FieldLabel>
      <FieldControl />
      <FieldMessage />
    </Field>
  ),
};
