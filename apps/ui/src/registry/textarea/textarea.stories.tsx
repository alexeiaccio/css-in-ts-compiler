// The textarea's stories: the input on many lines — the same border, focus ring and disabled look, and the invalid state
// read off `aria-invalid`, which `FieldControl` sets.
import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { Field, FieldControl, FieldLabel, FieldMessage } from "../field/field.tsx";
import { t } from "../theme.ts" with { type: "cssints" };
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

const grow = css.cn(
  css.display("block"),
  css.width("100%"),
  css.padding(t.space._2, t.space._3),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.fieldText),
  css.fontSize(t.font.size),
  css.fieldSizing("content"),
  css.minBlockSize("2lh"),
  css.maxBlockSize("10lh"),
  css.resize("none"),
);

// The recipe (docs/hosts.md): `field-sizing: content` grows the field with its text — no script, no hidden mirror
// (Baseline newly 2026-06-16; the bounds are the min/max block size).
export const AutoGrow: Story<TextareaProps> = {
  render: () => <textarea class={grow} placeholder="Type as much as you like; the field grows" />,
};
