// The canvas's stories: a board of cards laid out past the frame, so the minimap has something to show and a drag has
// somewhere to go. The frame is smaller than the world on purpose.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Canvas, type CanvasNodeInput, type CanvasProps } from "./canvas.tsx";

const COLUMNS = ["Backlog", "In progress", "Review", "Done"] as const;
const CARD_TITLES = [
  "Rotate the release notes",
  "Ship the snapping drag",
  "Split the router",
  "Cache the tokens",
  "Rewrite the empty state",
  "Trace the slow build",
  "Measure the menu",
  "Retire the old grid",
  "Audit the palette",
  "Fold the two stores",
  "Name the breakpoints",
  "Draw the minimap",
];

// four columns, three cards each, in world px: the world is wider than the 720 px frame
const CARDS: ReadonlyArray<CanvasNodeInput> = COLUMNS.flatMap((column, index) =>
  CARD_TITLES.slice(index * 3, index * 3 + 3).map((title, row) => ({
    id: `${column.toLowerCase().replace(" ", "-")}-${row}`,
    x: index * 280,
    y: row * 130,
    width: 232,
    height: 96,
    label: title,
    role: "article" as const,
    roleDescription: `${column} card`,
  })),
);

const meta = {
  title: "Canvas",
  component: Canvas,
  args: { nodes: CARDS, label: "Release board", width: 720, height: 460 },
  argTypes: {
    width: { type: "number", min: 320, step: 40 },
    height: { type: "number", min: 240, step: 40 },
  },
} satisfies Meta<CanvasProps>;
export default meta;

export const Board: Story<CanvasProps> = {};

// One column of the same board: the minimap's scale follows whatever the cards and the view add up to.
export const OneColumn: Story<CanvasProps> = {
  name: "One column",
  args: { nodes: CARDS.slice(0, 3), label: "One column" },
};

// Two frames of the same graph: the minimap is per canvas, and a click on it is a camera move.
export const Two: Story<CanvasProps> = {
  name: "Two canvases",
  render: (): JSX.Element => (
    <div class="demo-diagram">
      <Canvas nodes={CARDS} label="Release board, left" height={280} />
      <Canvas nodes={CARDS} label="Release board, right" height={280} />
    </div>
  ),
};
