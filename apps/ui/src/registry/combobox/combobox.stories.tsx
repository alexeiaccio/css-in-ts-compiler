// The combobox's stories: a searchable picker in the width a field has, with the one control it needs — `disabled`. The list
// opens on a click or the first typed character; a preview cannot press a key for the reader.
import type { JSX } from "@solidjs/web";

import type { Meta, Story } from "@cssints/stories";
import { Combobox, type ComboboxItem } from "./combobox.tsx";

const ITEMS: ReadonlyArray<ComboboxItem> = [
  { value: "accordion", label: "Accordion" },
  { value: "button", label: "Button" },
  { value: "checkbox", label: "Checkbox" },
  { value: "combobox", label: "Combobox" },
  { value: "dialog", label: "Dialog" },
  { value: "drawer", label: "Drawer" },
  { value: "field", label: "Field" },
  { value: "menu", label: "Menu" },
  { value: "radio", label: "Radio group" },
  { value: "select", label: "Select" },
  { value: "slider", label: "Slider" },
  { value: "switch", label: "Switch" },
];

interface ComboboxExampleProps {
  readonly disabled: boolean;
}

const ComboboxExample = (props: ComboboxExampleProps): JSX.Element => (
  <div class="demo-combobox">
    <Combobox
      items={ITEMS}
      label="Component"
      placeholder="Search components"
      disabled={props.disabled}
    />
  </div>
);

const meta = {
  title: "Combobox",
  component: ComboboxExample,
  args: { disabled: false },
  argTypes: {
    disabled: { type: "boolean" },
  },
} satisfies Meta<ComboboxExampleProps>;
export default meta;

export const Default: Story<ComboboxExampleProps> = {};

export const Disabled: Story<ComboboxExampleProps> = { args: { disabled: true } };
