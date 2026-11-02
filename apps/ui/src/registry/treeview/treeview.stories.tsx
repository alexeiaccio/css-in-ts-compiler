// The treeview's stories: a flat list of nodes with a `parent`, drawn as the tree the primitive describes. The rows carry
// their own `aria-level`, expanded flag and selection, and the skin indents from `aria-level` — never from a depth prop.
import type { Meta, Story } from "@cssints/stories";

import { Treeview, type TreeviewProps } from "./treeview.tsx";

const NODES = [
  { id: 1, parent: 0, label: "Projects" },
  { id: 2, parent: 1, label: "Reports" },
  { id: 3, parent: 2, label: "Roadmap" },
  { id: 4, parent: 2, label: "Summary" },
  { id: 5, parent: 1, label: "Notes" },
  { id: 6, parent: 0, label: "Photos" },
];

const meta = {
  title: "Treeview",
  args: { nodes: NODES, label: "Files", defaultValue: [2], defaultExpanded: [1, 2] },
} satisfies Meta<TreeviewProps>;
export default meta;

export const Files: Story<TreeviewProps> = {
  render: (args) => (
    <Treeview
      nodes={NODES}
      label="Files"
      defaultValue={args["defaultValue"] as ReadonlyArray<number>}
      defaultExpanded={[1, 2]}
    />
  ),
};

export const Collapsed: Story<TreeviewProps> = {
  render: () => <Treeview nodes={NODES} label="Files" defaultExpanded={[]} />,
};
