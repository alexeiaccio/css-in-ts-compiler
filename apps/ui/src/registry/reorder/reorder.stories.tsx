// The reorderable list's stories: the rows are read once, when the primitive is created (the option id is the index, so an
// item keeps its identity over every move), and the order is the primitive's. Drag a row by the dots, or focus the list and
// press Alt+↑ / Alt+↓.
import type { Meta, Story } from "@cssints/stories";

import { Reorder, type ReorderItem } from "./reorder.tsx";

const SECTIONS: ReadonlyArray<ReorderItem> = [
  { label: "Home", description: "The dashboard, first thing in the morning" },
  { label: "Search", description: "Find a track or a station by name" },
  { label: "Library", description: "Saved albums, playlists and shows" },
  { label: "Radio", description: "Live stations and the shows on now" },
  { label: "Podcasts", description: "New episodes of the shows you follow" },
  { label: "Settings", description: "Playback, downloads and the account" },
];

const meta = { title: "Reorderable list" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => <Reorder items={SECTIONS} label="Home sections" />,
};

// Another page's rows: labels only, no second line — a row without a description still reads as a row.
export const LabelsOnly: Story = {
  name: "Labels only",
  render: () => (
    <Reorder
      items={SECTIONS.map((item) => ({ label: item.label }))}
      label="A page's sections"
      hint="Drag a row by the dots, or Alt+↑ / Alt+↓ on the focused row."
    />
  ),
};
