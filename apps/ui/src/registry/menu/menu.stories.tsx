// The menu's stories: the primitive owns the open state, the roving focus and the typeahead, so a story is the declaration
// of the items. A disabled item is announced and skipped.
import type { Meta, Story } from "@cssints/stories";

import { Menu, MenuContent, MenuTrigger } from "./menu.tsx";

const meta = { title: "Menu" } satisfies Meta;
export default meta;

export const Actions: Story = {
  render: () => (
    <Menu items={["Rename", "Duplicate", { label: "Delete", disabled: true }]}>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuContent />
    </Menu>
  ),
};

export const Edit: Story = {
  render: () => (
    <Menu items={["Cut", "Copy", "Paste"]}>
      <MenuTrigger>Edit</MenuTrigger>
      <MenuContent />
    </Menu>
  ),
};
