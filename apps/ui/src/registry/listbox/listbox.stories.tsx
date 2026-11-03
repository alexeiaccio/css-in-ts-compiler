// The listbox's stories: the rows and the mode are the props. `single` is one chosen row, `multiple` adds the check marks
// and `none` moves a cursor with nothing selected.
import type { Meta, Story } from "@cssints/stories";

import { Listbox, type ListboxProps } from "./listbox.tsx";

const FRUIT: ReadonlyArray<string> = [
  "Apple",
  "Apricot",
  "Banana",
  "Blackberry",
  "Cherry",
  "Fig",
  "Grape",
  "Kiwi",
];

const meta = {
  title: "Listbox",
  component: Listbox,
  args: { items: FRUIT, label: "Fruit", selectionMode: "single", defaultValue: [2] },
  argTypes: {
    label: { type: "text" },
    selectionMode: { type: "select", options: ["single", "multiple", "none"] },
    followsFocus: { type: "boolean" },
    focusOnHover: { type: "boolean" },
  },
} satisfies Meta<ListboxProps>;
export default meta;

export const Default: Story<ListboxProps> = {};

export const Multiple: Story<ListboxProps> = {
  args: { selectionMode: "multiple", defaultValue: [0, 3] },
};

// No selection at all: the arrows and the type-ahead still move a cursor over the rows.
export const CursorOnly: Story<ListboxProps> = {
  name: "Cursor only",
  args: { selectionMode: "none", defaultValue: [] },
};
