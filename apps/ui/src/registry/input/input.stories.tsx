// The input's stories: one border, one radius, the focus ring a control wears, and the invalid state read off
// `aria-invalid` rather than a class of its own.
import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };
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

const validated = css.cn(
  css.padding(t.space._2, t.space._3),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.fieldText),
  css.fontSize(t.font.size),
  css.userInvalid(css.border("1px solid", t.color.invalid), css.outline("2px solid", t.color.invalid)),
);

// The recipe (docs/hosts.md): the browser owns the validation state. `:user-invalid` is true after the user has
// interacted with a control that fails its constraints — no `touched` flag, no aria-invalid written by hand.
export const UserInvalid: Story<InputProps> = {
  render: () => (
    <input class={validated} required minlength={3} placeholder="At least three characters, then leave the field" />
  ),
};
