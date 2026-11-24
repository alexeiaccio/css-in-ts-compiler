import type { Meta, Story } from "@cssints/stories";

import { Field, type FieldProps } from "./field.tsx";

export default {
  title: "DS/Field",
  component: Field,
  args: { label: "Email", placeholder: "you@example.com", hint: "We never share it." },
  argTypes: {
    label: { type: "text" },
    placeholder: { type: "text" },
    hint: { type: "text" },
    error: { type: "text" },
    invalid: { type: "boolean" },
    required: { type: "boolean" },
  },
} satisfies Meta<FieldProps>;

export const Default: Story<FieldProps> = {};

export const WithHintAndError: Story<FieldProps> = {
  name: "With a hint and an error",
  args: { invalid: true, error: "That address is missing an @." },
};

export const Required: Story<FieldProps> = { args: { required: true } };
