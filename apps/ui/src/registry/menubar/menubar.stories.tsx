// The menubar's stories: the bar is declared once, as a tree — the labels are the primitive's typeahead and the rows are
// built from the same tree, so a story is that declaration. The popups are inline-absolute in each bar item's anchor.
import type { Meta, Story } from "@cssints/stories";

import { Menubar } from "./menubar.tsx";

const FILE = [
  { label: "New" },
  { label: "Export", submenu: [{ label: "PDF" }, { label: "PNG" }] },
  { label: "Close" },
];

const meta = { title: "Menubar" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <Menubar
      items={[
        { label: "File", menu: FILE },
        { label: "Edit", menu: [{ label: "Undo" }, { label: "Redo" }] },
        { label: "Help" },
      ]}
    />
  ),
};

// A disabled row is announced and skipped by the keys; the bar item without a menu is still a bar item, so Right/Left
// walks over it.
export const DisabledItem: Story = {
  name: "Disabled item",
  render: () => (
    <Menubar
      items={[
        { label: "File", menu: [{ label: "New" }, { label: "Close", disabled: true }] },
        { label: "Edit", menu: [{ label: "Undo" }, { label: "Redo" }] },
        { label: "Help" },
      ]}
    />
  ),
};
