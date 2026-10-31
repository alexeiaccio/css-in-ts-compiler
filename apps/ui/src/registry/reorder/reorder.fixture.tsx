import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Reorder, type ReorderItem } from "./reorder.tsx";

/**
 * Six sections of a home screen, in the order the demo starts them. The description is the one line a row shows under
 * its label; a row that has none still reads as a row.
 */
export const REORDER_ITEMS: ReadonlyArray<ReorderItem> = [
  { label: "Home", description: "The dashboard, first thing in the morning" },
  { label: "Search", description: "Find a track or a station by name" },
  { label: "Library", description: "Saved albums, playlists and shows" },
  { label: "Radio", description: "Live stations and the shows on now" },
  { label: "Podcasts", description: "New episodes of the shows you follow" },
  { label: "Settings", description: "Playback, downloads and the account" },
];

/** The list's accessible name: what these rows order. */
export const REORDER_LABEL = "Home sections";

/** The one sentence the demo says about the drag and the keys. */
export const REORDER_HINT =
  "Drag a row by the dots, or focus the list and press Alt+↑ / Alt+↓ to move the focused row; the number on the right and the status line follow it.";

export interface ReorderExampleProps {
  readonly class?: string | undefined;
  readonly onReorder?: ((items: ReadonlyArray<ReorderItem>) => void) | undefined;
}

/**
 * The starter in ordinary use: the sections of a home screen, each with its handle and its place number. A page copies
 * this and swaps `REORDER_ITEMS` for its own rows and `onReorder` for its own save.
 */
export const ReorderExample = (props: ReorderExampleProps): JSX.Element => (
  <Reorder
    class={props.class}
    items={REORDER_ITEMS}
    label={REORDER_LABEL}
    hint={REORDER_HINT}
    onReorder={props.onReorder}
  />
);

/** What a mounted demo hands the test: where it lives, the last order a page would have saved, and a teardown. */
export interface MountedReorder {
  readonly root: HTMLElement;
  /** The labels of the rows as the page last heard them. */
  readonly order: () => ReadonlyArray<string>;
  /** Every `onReorder` the host received, oldest first. */
  readonly calls: () => ReadonlyArray<ReadonlyArray<string>>;
  readonly dispose: () => void;
}

/** Mounts the styled list at the demo's width. The primitive owns the order; the host only hears it. */
export const mountReorder = (): MountedReorder => {
  const root = document.createElement("div");
  root.style.width = "32rem";
  document.body.append(root);
  const [order, setOrder] = createSignal(REORDER_ITEMS.map((item) => item.label));
  const calls: string[][] = [];
  const dispose = render(
    () => (
      <ReorderExample
        onReorder={(items) => {
          const labels = items.map((item) => item.label);
          calls.push(labels);
          setOrder(labels);
        }}
      />
    ),
    root,
  );
  return {
    root,
    order,
    calls: () => calls,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
