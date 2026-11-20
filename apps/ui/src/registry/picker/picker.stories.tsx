// The picker's stories: the article's delivery choice (each option carries the arrival and the price), a typeface list where
// the option is the preview, and the same field with a note on the rows that need one.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";
import { createSignal } from "solid-js";

import { Picker, type PickerOption, type PickerProps } from "./picker.tsx";

const DELIVERY: ReadonlyArray<PickerOption> = [
  {
    value: "same-day",
    label: "Same-day courier",
    detail: "Today by 9 pm",
    note: "$14.00",
  },
  { value: "express", label: "Express", detail: "Tomorrow", note: "$8.50" },
  { value: "standard", label: "Standard", detail: "3–5 days", note: "$3.90" },
  { value: "pickup", label: "Pickup point", detail: "2–3 days", note: "Free" },
];

const meta = {
  title: "Picker",
  component: Picker,
  args: { label: "Delivery", name: "delivery", options: DELIVERY, columns: "1fr 7rem 4.5rem" },
} satisfies Meta<PickerProps>;
export default meta;

export const Delivery: Story<PickerProps> = {};

// The option is the preview: each row is set in its own face, so the list answers "what does it look like" before the
// choice is made. The closed control keeps the typeface of the answer.
const TYPEFACES: ReadonlyArray<PickerOption> = [
  {
    value: "gentium",
    label: "Gentium Book Basic",
    detail: "Serif",
    style: { "font-family": "serif" },
  },
  {
    value: "fraunces",
    label: "Fraunces",
    detail: "Serif",
    style: { "font-family": "Georgia, serif" },
  },
  {
    value: "literata",
    label: "Literata",
    detail: "Serif",
    style: { "font-family": "Palatino, serif" },
  },
  {
    value: "grotesk",
    label: "Space Grotesk",
    detail: "Sans",
    style: { "font-family": "system-ui, sans-serif" },
  },
  {
    value: "mono",
    label: "IBM Plex Mono",
    detail: "Mono",
    style: { "font-family": "ui-monospace, monospace" },
  },
  { value: "caveat", label: "Caveat", detail: "Handwriting", style: { "font-family": "cursive" } },
];

export const Typefaces: Story<PickerProps> = {
  args: { label: "Heading font", name: "font", options: TYPEFACES, columns: "1fr 6rem" },
};

// A note marks the rows with a consequence, and only those: what needs approval says so before the value moves.
export const Notes: Story<PickerProps> = {
  args: {
    label: "Share the report with",
    name: "team",
    columns: "1fr",
    options: [
      { value: "engineering", label: "Engineering" },
      { value: "design", label: "Design" },
      { value: "finance", label: "Finance", note: "needs approval" },
      { value: "legal", label: "Legal", note: "needs approval" },
      { value: "security", label: "Security", note: "needs approval" },
      { value: "support", label: "Support" },
    ],
  },
};

// The same field as a form control: controlled, with the value it reports under it.
export const Controlled: Story<PickerProps> = {
  name: "Controlled",
  render: (): JSX.Element => {
    const [value, setValue] = createSignal("express");
    return (
      <div class="demo-diagram">
        <Picker
          label="Delivery"
          name="delivery"
          options={DELIVERY}
          value={value()}
          onValueChange={setValue}
        />
        <p class="demo-text">
          The form would send <code>{value()}</code>; the browser owns the keys, the name and the
          value.
        </p>
      </div>
    );
  },
};
