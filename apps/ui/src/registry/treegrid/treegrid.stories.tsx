// The treegrid's stories: folders and files as a grid — a row expands, a cell is reached with the arrows, and the size column
// is right-aligned with tabular figures. The primitive owns the tree, the focus and the selection; the page brings the data.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Treegrid, type TreegridColumn, type TreegridRow } from "./treegrid.tsx";

const ROWS: ReadonlyArray<TreegridRow> = [
  { id: "src", label: "src", cells: { kind: "folder", size: "" } },
  { id: "app", parent: 0, label: "app.tsx", cells: { kind: "file", size: "4 kB" } },
  { id: "styles", parent: 0, label: "styles.css", cells: { kind: "file", size: "1 kB" } },
  { id: "docs", label: "docs", cells: { kind: "folder", size: "" } },
  { id: "readme", parent: 3, label: "README.md", cells: { kind: "file", size: "2 kB" } },
  { id: "pkg", label: "package.json", cells: { kind: "file", size: "1 kB" } },
];

const COLUMNS: ReadonlyArray<TreegridColumn> = [
  { key: "name", label: "Name" },
  { key: "kind", label: "Kind" },
  { key: "size", label: "Size", numeric: true },
];

const meta = { title: "Treegrid" } satisfies Meta;
export default meta;

export const Files: Story = {
  render: () => <Treegrid rows={ROWS} columns={COLUMNS} label="Project files" defaultExpanded={["src"]} />,
};

// Nothing expanded: the two folders are the only rows, and Right on a folder opens it.
export const Collapsed: Story = {
  render: () => <Treegrid rows={ROWS} columns={COLUMNS} label="Project files" />,
};
