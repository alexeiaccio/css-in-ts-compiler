// The board's stories: the kit's whole design system on one plane — every token the theme publishes, the components that
// consume them, and an arrow for every use. The map is the point: a token card carries its painted value, its value as a
// field and the rule behind it (Design Book's argument, meodai: a token that keeps its reason), a part card holds the real
// component, and picking a card lights its reach while the rest step back. Typing into a token's field sets the token on the
// plane, so the previews, the swatches and the cards made of it all move with one edit — and the outline under the map is
// the same list read in order, one press from the card it names.
//
// The plane is bigger than the frame on purpose: this is the "one canvas" view of a design system, read by panning and
// zooming, with Fit (`0`) as the overview. The mode switch in the board's settings bar is the theme's mise-en-mode look over
// the plane (`data-mode`), so the same map is inspected light and dark with no second dataset.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Badge } from "../badge/badge.tsx";
import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import { Switch } from "../switch/switch.tsx";
import { Tabs } from "../tabs/tabs.tsx";
import { Board, type BoardEdge, type BoardNode, type BoardProps } from "./board.tsx";

interface TokenSpec {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly note: string;
  /** The CSS property the token feeds, which is what makes its value editable on the card. */
  readonly property: string;
  readonly swatch?: string;
}

interface PartSpec {
  readonly id: string;
  readonly title: string;
  /** The token ids the part consumes, one arrow each. */
  readonly uses: ReadonlyArray<string>;
}

/** The colour tokens the theme publishes; the swatch is the token itself, never a copy of its value. */
const COLOURS: ReadonlyArray<TokenSpec> = [
  ["color-page", "color.page", "the plane", "Everything sits on it.", "color"],
  ["color-surface", "color.surface", "panel", "Cards above the page.", "color"],
  ["color-text", "color.text", "body text", "7:1 against the page.", "color"],
  ["color-muted", "color.muted", "hints", "4.5:1, one step quieter.", "color"],
  ["color-border", "color.border", "hairline", "Between blocks, never a shadow.", "color"],
  ["color-highlight", "color.highlight", "accent", "The one accent.", "color"],
  ["color-on-highlight", "color.on-highlight", "on accent", "Text on a highlight fill.", "color"],
  ["color-link", "color.link", "link", "On a card, at 4.5:1.", "color"],
  ["color-invalid", "color.invalid", "error", "Errors and the invalid ring.", "color"],
  ["color-focus-ring", "color.focus-ring", "focus", "The keyboard's ring, 3:1.", "color"],
].map(([id, title, detail, note, property]) => ({
  id: id as string,
  title: title as string,
  detail: detail as string,
  note: note as string,
  property: property as string,
  swatch: `var(--${id})`,
}));

/** The steps and the type scale: no swatch, the value is the text. */
const STEPS: ReadonlyArray<TokenSpec> = [
  ["radius-sm", "radius.sm", "6px", "Controls inside a card.", "border-radius"],
  ["radius-md", "radius.md", "8px", "Cards and sheets.", "border-radius"],
  ["radius-xl", "radius.xl", "16px", "The frame of a surface.", "border-radius"],
  ["space-1", "space.1", "4px", "The gap inside a label.", "padding"],
  ["space-2", "space.2", "8px", "Padding inside a control.", "padding"],
  ["space-4", "space.4", "16px", "Between blocks.", "padding"],
  ["font-sm", "font.sizeSm", "12px", "Captions and hints.", "font-size"],
  ["font-base", "font.size", "14px", "The body.", "font-size"],
  ["font-lg", "font.sizeLg", "16px", "A section's lead.", "font-size"],
].map(([id, title, detail, note, property]) => ({
  id: id as string,
  title: title as string,
  detail: detail as string,
  note: note as string,
  property: property as string,
}));

const PARTS: ReadonlyArray<PartSpec> = [
  {
    id: "button",
    title: "Button",
    uses: ["color-highlight", "color-on-highlight", "radius-sm", "space-2", "font-base"],
  },
  {
    id: "badge",
    title: "Badge",
    uses: ["color-highlight", "color-on-highlight", "space-1", "font-sm"],
  },
  {
    id: "switch",
    title: "Switch",
    uses: ["color-highlight", "color-border", "space-1", "font-base"],
  },
  {
    id: "input",
    title: "Input",
    uses: ["color-surface", "color-border", "color-focus-ring", "space-2", "font-base"],
  },
  {
    id: "tabs",
    title: "Tabs",
    uses: ["color-highlight", "color-muted", "color-border", "space-2", "font-base"],
  },
];

// The layout is a function of the lists: five columns of tokens (the colours, then the steps and the type), and the parts in
// a row under them, so the arrows fan up out of the components instead of crossing the whole map. A token added to the theme
// moves the map instead of leaving a hole.
const TOKEN_WIDTH = 190;
const TOKEN_HEIGHT = 132;
const COLUMN = TOKEN_WIDTH + 16;
const ROW = TOKEN_HEIGHT + 14;
const COLUMNS = 5;
const PART_WIDTH = 250;
const PART_HEIGHT = 168;
const PART_ROW = 16 + 4 * ROW + 24;

const tokens = (specs: ReadonlyArray<TokenSpec>, top: number): BoardNode[] =>
  specs.map((spec, index) => ({
    ...spec,
    kind: "token",
    width: TOKEN_WIDTH,
    height: TOKEN_HEIGHT,
    x: 16 + (index % COLUMNS) * COLUMN,
    y: top + Math.floor(index / COLUMNS) * ROW,
  }));

const parts = (): BoardNode[] =>
  PARTS.map((spec, index) => ({
    id: spec.id,
    kind: "part",
    title: spec.title,
    width: PART_WIDTH,
    height: PART_HEIGHT,
    x: 16 + index * (PART_WIDTH + 18),
    y: PART_ROW,
  }));

// The map's own size: the tokens' five columns and, under them, the row of parts. The board is given it, so pan and zoom know
// how big the canvas is and Fit (`0`) pulls all of it into the frame.
const MAP_WIDTH = 16 + 5 * (PART_WIDTH + 18) - 18 + 16;
const MAP_HEIGHT = PART_ROW + PART_HEIGHT + 16;

const NODES: ReadonlyArray<BoardNode> = [
  ...tokens(COLOURS, 16),
  ...tokens(STEPS, 16 + 2 * ROW),
  ...parts(),
];

// One line of the map is a CSS connector: its shape() is a border-shape where the browser has it and the same curve as an
// SVG path where it has not (the article's technique on a real map). The rest keep perfect-arrows' routed curve, which is
// the one that avoids the cards.
const EDGES: ReadonlyArray<BoardEdge> = PARTS.flatMap((spec) =>
  spec.uses.map((to) => ({
    from: spec.id,
    to,
    ...(spec.id === "button" && to === "color-highlight" ? { line: "shape" as const } : {}),
  })),
);

// A part card holds the real component, styled by the tokens above it. The card marks the preview inert: it is a picture of
// the component on the map, not a second control the page has to keep in step.
const preview = (node: BoardNode): JSX.Element | undefined => {
  switch (node.id) {
    case "button":
      return <Button tone="accent">Ship it</Button>;
    case "badge":
      return <Badge tone="accent">new</Badge>;
    case "switch":
      return <Switch defaultValue>Wi-Fi</Switch>;
    case "input":
      return <Input placeholder="name@example.com" aria-label="Email" />;
    case "tabs":
      return (
        <Tabs
          items={2}
          tab={(index) => ["Overview", "Settings"][index] ?? ""}
          panel={() => undefined}
        />
      );
    default:
      return undefined;
  }
};

const meta = {
  title: "Board",
  component: Board,
  args: { label: "The design system, one canvas", nodes: NODES, edges: EDGES },
  argTypes: { label: { type: "text" } },
} satisfies Meta<BoardProps>;
export default meta;

export const DesignSystem: Story<BoardProps> = {
  render: (args) => (
    <Board {...args} preview={preview} width={MAP_WIDTH} height={MAP_HEIGHT} defaultScale={0.5} />
  ),
};

// The same map under the dark look, opened that way: no second dataset, no second story to keep in step — the plane's mode
// is the theme's, and every card, swatch and arrow follows it.
export const Dark: Story<BoardProps> = {
  render: () => (
    <Board
      label="The design system, dark"
      nodes={NODES}
      edges={EDGES}
      preview={preview}
      defaultMode="dark"
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      defaultScale={0.5}
    />
  ),
};

// A token made current: the parts that use it stay lit, the rest step back. This is the management view the board exists
// for — the blast radius of one decision, on the plane.
export const Current: Story<BoardProps> = {
  render: () => (
    <Board
      label="What color.highlight reaches"
      nodes={NODES}
      edges={EDGES}
      preview={preview}
      defaultSelected="color-highlight"
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      defaultScale={0.5}
    />
  ),
};
