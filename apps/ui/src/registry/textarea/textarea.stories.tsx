// The textarea's stories: the input on many lines — the same border, focus ring and disabled look, and the invalid state
// read off `aria-invalid`, which `FieldControl` sets.
import type { Meta, Story } from "@cssints/stories";

import { Field, FieldControl, FieldLabel, FieldMessage } from "../field/field.tsx";
import { Textarea, type TextareaProps } from "./textarea.tsx";

const meta = {
  title: "Textarea",
  component: Textarea,
  args: { placeholder: "A plain textarea" },
  argTypes: { disabled: { type: "boolean" }, rows: { type: "number", min: 2, max: 12, step: 1 } },
} satisfies Meta<TextareaProps>;
export default meta;

export const Default: Story<TextareaProps> = {};

export const InAField: Story = {
  name: "In a field",
  render: () => (
    <Field id="story-notes" hint="Markdown is fine">
      <FieldLabel>Notes</FieldLabel>
      <FieldControl render={(props) => <Textarea {...props} rows={4} />} />
      <FieldMessage />
    </Field>
  ),
};
