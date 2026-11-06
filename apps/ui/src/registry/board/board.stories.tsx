// The board's stories: the kit's own design system as a map — tokens on the left, the components that use them on the right,
// and a line for every use. The point is the blast radius: making a token current lights the cards and lines it reaches, so
// "what moves if I change this" is read off the board instead of from a spreadsheet.
//
// A token's card carries three things, following Design Book (meodai): the painted value (the swatch), the value as text (or
// the role a colour has no number for) and the rule behind it. A card that says only `#3b5bdb` keeps the answer and throws
// away the reason; this one keeps both.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Badge } from "../badge/badge.tsx";
import { Button } from "../button/button.tsx";
import { Board, type BoardEdge, type BoardNode, type BoardProps } from "./board.tsx";

// The same theme the site is built on: the values are `var(--color-…)`, so the board moves with the mode and the tint, and
// nothing here is a second copy of the palette.
const NODES: ReadonlyArray<BoardNode> = [
  {
    id: "highlight",
    kind: "token",
    x: 16,
    y: 16,
    width: 190,
    height: 110,
    title: "color.highlight",
    detail: "accent",
    note: "The one accent.",
    swatch: "var(--color-highlight)",
  },
  {
    id: "on-highlight",
    kind: "token",
    x: 16,
    y: 140,
    width: 190,
    height: 110,
    title: "color.on-highlight",
    detail: "on accent",
    note: "Text on a highlight fill.",
    swatch: "var(--color-on-highlight)",
  },
  {
    id: "surface",
    kind: "token",
    x: 16,
    y: 264,
    width: 190,
    height: 110,
    title: "color.surface",
    detail: "panel",
    note: "Panels above the page.",
    swatch: "var(--color-surface)",
  },
  {
    id: "radius",
    kind: "token",
    x: 216,
    y: 16,
    width: 190,
    height: 110,
    title: "radius.sm",
    detail: "6px",
    note: "Controls inside a card.",
  },
  {
    id: "space",
    kind: "token",
    x: 216,
    y: 140,
    width: 190,
    height: 110,
    title: "space.2",
    detail: "8px",
    note: "Padding inside a control.",
  },
  { id: "button", kind: "part", x: 430, y: 16, width: 240, height: 150, title: "Button" },
  { id: "badge", kind: "part", x: 430, y: 188, width: 240, height: 130, title: "Badge" },
];

const EDGES: ReadonlyArray<BoardEdge> = [
  { from: "button", to: "highlight" },
  { from: "button", to: "on-highlight" },
  { from: "button", to: "radius" },
  { from: "button", to: "space" },
  { from: "badge", to: "highlight" },
  { from: "badge", to: "on-highlight" },
];

// A part card holds the real component, styled by the tokens above it. The card marks it inert: the preview is a picture of
// the component on the board, not a second control the page has to keep in step.
const preview = (node: BoardNode): JSX.Element | undefined => {
  if (node.id === "button") {
    return <Button tone="accent">Ship it</Button>;
  }
  if (node.id === "badge") {
    return <Badge tone="accent">new</Badge>;
  }
  return undefined;
};

const meta = {
  title: "Board",
  component: Board,
  args: { label: "Design system map", nodes: NODES, edges: EDGES },
  argTypes: { label: { type: "text" } },
} satisfies Meta<BoardProps>;
export default meta;

export const DesignSystem: Story<BoardProps> = {
  render: (args) => <Board {...args} preview={preview} />,
};

// The same map in dark: every card, swatch and line is a token, so the board follows the mode with no second dataset.
export const Dark: Story<BoardProps> = {
  render: () => (
    <div
      data-mode="dark"
      style={{ padding: "16px", background: "var(--color-page)", "border-radius": "16px" }}
    >
      <Board label="Design system map, dark" nodes={NODES} edges={EDGES} preview={preview} />
    </div>
  ),
};

// A token made current: the cards and lines it reaches stay lit, and the rest step back. This is the management view the
// board exists for — the blast radius of one decision, on the plane.
export const Current: Story<BoardProps> = {
  render: () => (
    <Board
      label="What color.highlight reaches"
      nodes={NODES}
      edges={EDGES}
      preview={preview}
      defaultSelected="highlight"
    />
  ),
};
