import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { For } from "solid-js";

import { ResizablePanels } from "./resizable-panels.tsx";

/** The demo's files: names are enough, nothing opens. */
export const PANEL_FILES = ["index.html", "styles.css", "app.tsx", "notes.md", "package.json"];

/** The middle pane's code, shown as written. */
export const PANEL_CODE = `export const App = () => (
  <ResizablePanels
    panes={[
      { title: "Files", min: 15, collapsible: true },
      { title: "Editor", min: 25 },
      { title: "Preview", min: 15 },
    ]}
  />
);`;

const fileStyle = {
  display: "block",
  width: "100%",
  padding: "2px 4px",
  border: "0",
  borderRadius: "4px",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  textAlign: "start",
  cursor: "pointer",
} as const;

const file = (name: string): JSX.Element => (
  <button type="button" data-part="resizable-panels-file" style={fileStyle}>
    {name}
  </button>
);

const FilesPane = (): JSX.Element => (
  <div style={{ display: "grid", gap: "2px" }}>
    <For each={PANEL_FILES}>{file}</For>
  </div>
);

const EditorPane = (): JSX.Element => (
  <pre
    style={{
      margin: "0",
      "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
      "font-size": "0.75rem",
      "line-height": "1.6",
      "white-space": "pre-wrap",
    }}
  >
    {PANEL_CODE}
  </pre>
);

const PreviewPane = (): JSX.Element => (
  <div
    style={{
      display: "grid",
      "place-items": "center",
      height: "100%",
      "min-height": "6rem",
      "border-radius": "6px",
      background: "linear-gradient(135deg, #d9e6f2, #8aa9c9)",
      color: "#1f3242",
      "font-size": "0.75rem",
    }}
  >
    index.html
  </div>
);

/**
 * The starter in ordinary use: a Files / Editor / Preview workspace. The middle pane is the flexible one, the side panes
 * have minimums, and the first one folds away with Enter. The sentence under it is the whole keyboard contract.
 */
export const ResizablePanelsExample = (props: {
  readonly class?: string | undefined;
}): JSX.Element => (
  <div class="demo-column">
    <ResizablePanels
      class={props.class}
      label="Workspace layout"
      defaultSizes={[22, 50, 28]}
      panes={[
        { title: "Files", label: "Files", min: 15, collapsible: true, children: <FilesPane /> },
        { title: "Editor", label: "Editor", min: 25, children: <EditorPane /> },
        { title: "Preview", label: "Preview", min: 15, children: <PreviewPane /> },
      ]}
    />
    <p class="demo-text">
      Drag a divider to resize a pane, or focus it and use the arrow keys; Home and End jump to the
      bounds, and Enter folds the Files pane away.
    </p>
  </div>
);

/** What a mounted demo hands the test: where it lives and a teardown. */
export interface MountedResizablePanels {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/** The demo's width, so a percent step is a whole number of pixels and the drag math is the same in every test run. */
const DEMO_WIDTH = 600;

/** Mounts the styled layout at 600 px, the width the fixture's drag tests measure against. */
export const mountResizablePanels = (): MountedResizablePanels => {
  const root = document.createElement("div");
  root.style.width = `${DEMO_WIDTH}px`;
  document.body.append(root);
  const dispose = render(() => <ResizablePanelsExample />, root);
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
