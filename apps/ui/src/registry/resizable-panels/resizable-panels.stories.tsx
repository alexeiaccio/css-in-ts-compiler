// The resizable panels' stories: a tree, an editor and a preview, the two dividers between them and the whole layout a
// keyboard user can resize (each divider is a window splitter with arrows, Enter to collapse and Home/End to an end).
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { ResizablePanels } from "./resizable-panels.tsx";

const FILES = ["index.html", "styles.css", "app.tsx", "notes.md", "package.json"];

const meta = { title: "Resizable panels" } satisfies Meta;
export default meta;

export const Editor: Story = {
  render: () => (
    <div style={{ width: "100%" }}>
      <ResizablePanels
        label="Editor"
        height="22rem"
        panes={[
          {
            title: "Files",
            min: 15,
            collapsible: true,
            children: (
              <ul class="demo-text">
                {FILES.map((name) => (
                  <li>{name}</li>
                ))}
              </ul>
            ),
          },
          {
            title: "Editor",
            min: 25,
            children: (
              <p class="demo-text">
                The middle pane grows and shrinks; the dividers on either side are splits.
              </p>
            ),
          },
          {
            title: "Preview",
            min: 15,
            collapsible: true,
            children: (
              <p class="demo-text">
                A pane with `collapsible` folds away on Enter and comes back at its size.
              </p>
            ),
          },
        ]}
      />
    </div>
  ),
};

// `horizontal` stacks the panes: the same group, the same dividers, one above the other.
export const Stacked: Story = {
  render: () => (
    <div style={{ width: "100%" }}>
      <ResizablePanels
        label="Stacked"
        orientation="horizontal"
        height="22rem"
        panes={[
          { title: "Query", min: 20, children: <p class="demo-text">select * from issues</p> },
          { title: "Results", min: 30, children: <p class="demo-text">42 rows</p> },
        ]}
      />
    </div>
  ),
};
