import { render } from "@solidjs/web";
import { createSignal, For } from "solid-js";

import { Scrollspy, type ScrollspyEntry } from "./scrollspy.tsx";

/** The heading a section starts with; the levels are what the list indents by. */
interface Section {
  readonly id: string;
  readonly text: string;
  readonly level: number;
  readonly body: string;
}

const SECTIONS: ReadonlyArray<Section> = [
  {
    id: "scrollspy-overview",
    text: "Overview",
    level: 1,
    body: "A table of contents beside an article: the link of the heading that last passed the top of the pane is current.",
  },
  {
    id: "scrollspy-install",
    text: "Install",
    level: 2,
    body: "The package, the theme and the plugin. This heading is below the fold until the pane scrolls.",
  },
  {
    id: "scrollspy-configure",
    text: "Configure",
    level: 2,
    body: "The entries in document order, the container the primitive listens on, and the offset of a sticky header.",
  },
  {
    id: "scrollspy-deploy",
    text: "Deploy",
    level: 1,
    body: "The last section is not in the table until a page adds it: the entries are read again on every scroll.",
  },
];

/** The table before any change: the page lists its first three headings. */
export const SCROLLSPY_ENTRIES: ReadonlyArray<ScrollspyEntry> = SECTIONS.slice(0, 3).map(
  ({ id, text, level }) => ({ id, text, level }),
);

/** The entry a page adds later: its heading is already in the article, the table has not read it yet. */
export const SCROLLSPY_LAST: ScrollspyEntry = { id: "scrollspy-deploy", text: "Deploy", level: 1 };

/** The pane's height, so a section (and the heading after it) starts below the fold. */
const PANE_HEIGHT = 260;

/** One section's height: taller than the pane, so only one heading is at the top at a time. */
const SECTION_HEIGHT = 300;

/** What a mounted demo hands the test: the pane it scrolls, a way to grow the table, and a teardown. */
export interface MountedScrollspy {
  readonly root: HTMLElement;
  /** The scroll container the primitive watches. */
  readonly pane: HTMLElement;
  /** Adds the last section to the table, the way a page grows its outline. */
  readonly reveal: () => void;
  readonly dispose: () => void;
}

/**
 * Mounts the styled table of contents in ordinary use: an article with four sections in a 260 px scroll pane, and the table
 * beside it. The pane is what the primitive listens on, so the demo works inside the docs preview without the page
 * scrolling; `reveal()` shows the entries changing.
 */
export const mountScrollspy = (): MountedScrollspy => {
  const root = document.createElement("div");
  document.body.append(root);
  let pane: HTMLDivElement | undefined;
  const [entries, setEntries] = createSignal<ReadonlyArray<ScrollspyEntry>>(SCROLLSPY_ENTRIES);

  const dispose = render(
    () => (
      <div
        data-part="scrollspy-demo"
        style={{
          display: "flex",
          gap: "24px",
          "align-items": "flex-start",
          width: "720px",
        }}
      >
        <div
          data-part="scrollspy-pane"
          ref={(element: HTMLDivElement) => {
            pane = element;
          }}
          style={{
            height: `${PANE_HEIGHT}px`,
            width: "420px",
            "overflow-y": "auto",
            padding: "0 16px",
            // no border: the primitive measures the heading against the scrollport's top, and a 1px border would leave a
            // fragment-scrolled heading 1px short of the line. The ring is a shadow, so the box model stays the scrollport's.
            "box-shadow": "inset 0 0 0 1px #d0d0d0",
            "border-radius": "8px",
            "box-sizing": "border-box",
          }}
        >
          <For each={SECTIONS}>
            {(section) => (
              <section style={{ height: `${SECTION_HEIGHT}px`, padding: "0", margin: "0" }}>
                <h2 id={section.id} style={{ margin: "0", "font-size": "18px" }}>
                  {section.text}
                </h2>
                <p style={{ margin: "8px 0 0", color: "#555" }}>{section.body}</p>
              </section>
            )}
          </For>
        </div>
        <div style={{ width: "200px" }}>
          <p style={{ margin: "0 0 8px", "font-size": "12px", color: "#666" }}>On this page</p>
          <Scrollspy entries={entries()} root={() => pane} />
        </div>
      </div>
    ),
    root,
  );

  if (pane === undefined) {
    throw new Error("scrollspy fixture: the pane was not mounted");
  }
  return {
    root,
    pane,
    reveal: () => setEntries([...SCROLLSPY_ENTRIES, SCROLLSPY_LAST]),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
