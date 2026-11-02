// The input's stories: one border, one radius, the focus ring a control wears, and the invalid state read off
// `aria-invalid` rather than a class of its own.
import type { Meta, Story } from "@cssints/stories";

import { Input, type InputProps } from "./input.tsx";

const meta = {
  title: "Input",
  component: Input,
  args: { placeholder: "A plain input" },
  argTypes: {
    disabled: { type: "boolean" },
    placeholder: { type: "text" },
  },
} satisfies Meta<InputProps>;
export default meta;

export const Default: Story<InputProps> = {};

export const Disabled: Story<InputProps> = { args: { disabled: true, value: "Disabled" } };

// The invalid state is the one the field announces: the skin paints `aria-invalid` and the input carries it itself.
export const Invalid: Story<InputProps> = {
  args: { "aria-invalid": "true", value: "not-an-email" },
};
