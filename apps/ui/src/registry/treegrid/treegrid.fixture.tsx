import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

import { Treegrid, type TreegridColumn, type TreegridRow } from "./treegrid.tsx";

/** The three roots and their children of the demo: a small project, with the sizes and dates a file list shows. */
export const TREEGRID_ROWS: ReadonlyArray<TreegridRow> = [
  {
    id: "src",
    label: "src",
    cells: { size: "12.3 kB", modified: "Mar 4, 09:12" },
  },
  {
    id: "App.tsx",
    parent: 0,
    label: "App.tsx",
    cells: { size: "1.8 kB", modified: "Mar 4, 09:02" },
  },
  {
    id: "styles.css",
    parent: 0,
    label: "styles.css",
    cells: { size: "2.1 kB", modified: "Mar 2, 17:40" },
  },
  {
    id: "components",
    parent: 0,
    label: "components",
    cells: { size: "6.1 kB", modified: "Feb 28, 11:05" },
  },
  {
    id: "Button.tsx",
    parent: 3,
    label: "Button.tsx",
    cells: { size: "3.4 kB", modified: "Feb 28, 11:01" },
  },
  {
    id: "Tabs.tsx",
    parent: 3,
    label: "Tabs.tsx",
    cells: { size: "2.7 kB", modified: "Feb 27, 16:22" },
  },
  {
    id: "public",
    label: "public",
    cells: { size: "85.1 kB", modified: "Feb 20, 08:30" },
  },
  {
    id: "favicon.svg",
    parent: 6,
    label: "favicon.svg",
    cells: { size: "1.1 kB", modified: "Jan 12, 10:00" },
  },
  {
    id: "hero.png",
    parent: 6,
    label: "hero.png",
    cells: { size: "84.0 kB", modified: "Feb 20, 08:30" },
  },
  {
    id: "tests",
    label: "tests",
    cells: { size: "8.1 kB", modified: "Mar 5, 14:18" },
  },
  {
    id: "app.test.ts",
    parent: 9,
    label: "app.test.ts",
    cells: { size: "6.2 kB", modified: "Mar 5, 14:18" },
  },
  {
    id: "helpers.ts",
    parent: 9,
    label: "helpers.ts",
    cells: { size: "1.9 kB", modified: "Mar 1, 09:47" },
  },
];

/** The tree column, a right-aligned size, and a date: the three columns a file list usually has. */
export const TREEGRID_COLUMNS: ReadonlyArray<TreegridColumn> = [
  { key: "name", label: "Name" },
  { key: "size", label: "Size", numeric: true },
  { key: "modified", label: "Modified" },
];

/** `src` and `public` are open at mount; `components` is closed, so the third level is one expander away. */
export const TREEGRID_EXPANDED: ReadonlyArray<string> = ["src", "public"];

export interface TreegridExampleProps {
  readonly class?: string | undefined;
}

/**
 * The starter in ordinary use: a project's files and folders as a grid, the two first folders open, the sizes right-aligned
 * and the dates beside them. A page copies this and swaps `TREEGRID_ROWS` for its own data.
 */
export const TreegridExample = (props: TreegridExampleProps): JSX.Element => (
  <Treegrid
    class={props.class}
    rows={TREEGRID_ROWS}
    columns={TREEGRID_COLUMNS}
    label="Project files"
    defaultExpanded={TREEGRID_EXPANDED}
  />
);

/** What a mounted demo hands the test: where it lives, and a teardown. */
export interface MountedTreegrid {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/** The demo's width, so the three columns have the same room in every test run. */
const DEMO_WIDTH = 640;

/**
 * Mounts the styled treegrid at a 640 px frame, with a button after it: the grid is one tab stop, and the button is where Tab
 * lands. The primitive owns the tree, the expanders, the focus and the selection; the fixture is the page's data.
 */
export const mountTreegrid = (): MountedTreegrid => {
  const root = document.createElement("div");
  root.style.width = `${DEMO_WIDTH}px`;
  document.body.append(root);
  const dispose = render(
    () => (
      <div style={{ display: "grid", gap: "8px" }}>
        <TreegridExample />
        <button type="button" data-part="treegrid-after">
          Continue
        </button>
      </div>
    ),
    root,
  );
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
