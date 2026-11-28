// The diagram's stories: a graph is data, so the meta has no component and the story composes it. The payment flow is the
// conformance fixture's own graph; the line under it is what the host heard, and the sentence before it says what the keys
// do. The drawing is plain SVG inside the component, so nothing is fetched.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { Diagram, type DiagramEdgeInput, type DiagramNodeInput } from "./diagram.tsx";
import { DiagramStarter } from "./starter.tsx";

const NODES: ReadonlyArray<DiagramNodeInput> = [
  { id: "cart", label: "Cart", x: 0, y: 24, width: 128, height: 48 },
  { id: "paid", label: "Paid", x: 196, y: 24, width: 128, height: 48 },
  { id: "shipped", label: "Shipped", x: 392, y: 24, width: 128, height: 48 },
  { id: "refunded", label: "Refunded", x: 196, y: 172, width: 128, height: 48 },
];

const EDGES: ReadonlyArray<DiagramEdgeInput> = [
  { id: "pay", from: "cart", to: "paid", label: "pay" },
  { id: "cancel", from: "cart", to: "refunded", label: "cancel" },
  { id: "ship", from: "paid", to: "shipped", label: "ship" },
  { id: "refund", from: "paid", to: "refunded", label: "refund" },
  { id: "resend", from: "refunded", to: "shipped", label: "resend" },
];

/** The starter's flow: the payment graph without `refunded -> shipped`, the one edge that points back. */
const STARTER_EDGES = EDGES.filter((edge) => edge.id !== "resend");

const labelOf = (id: string): string => NODES.find((node) => node.id === id)?.label ?? id;

const meta = { title: "Diagram" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: (): JSX.Element => {
    const [log, setLog] = createSignal(
      "Nothing activated yet: click a node, or press Enter on it.",
    );
    return (
      <div class="demo-diagram">
        <Diagram
          nodes={NODES}
          edges={EDGES}
          labels={{ diagram: "Payment flow" }}
          onActivate={(id) => setLog(`Node “${labelOf(id)}” activated.`)}
          onEdge={(id) => setLog(`Edge “${id}” fired.`)}
        />
        <p class="demo-text">
          Arrows follow the layout, Home and End jump, <code>e</code> lists the active node's edges
          and Enter opens one. Tab leaves the diagram.
        </p>
        <p class="demo-text">{log()}</p>
      </div>
    );
  },
};

// The same graph in the shape a flow is usually read in: orthogonal routes out of each box and into the next, one corner
// radius, no arithmetic in the host.
export const Smoothstep: Story = {
  name: "Smooth step",
  render: (): JSX.Element => (
    <div class="demo-diagram">
      <Diagram
        nodes={NODES}
        edges={EDGES}
        edge="smoothstep"
        labels={{ diagram: "Payment flow, smooth step" }}
      />
      <p class="demo-text">
        <code>edge="smoothstep"</code>: every line leaves its box, turns on a shared centre line and
        arrives square; <code>step</code> is the same route with sharp corners, and{" "}
        <code>bezier</code> is one cubic between them.
      </p>
    </div>
  ),
};

// Making an edge, both ways: c on a node and the arrows, or a drag from one node to another. The story keeps the graph — the
// primitive only says which pair was asked for.
export const Connect: Story = {
  name: "Making an edge",
  render: (): JSX.Element => {
    const [edges, setEdges] = createSignal<ReadonlyArray<DiagramEdgeInput>>(EDGES);
    const [log, setLog] = createSignal(
      "Press c on a node, or drag from one to another; Enter or the release makes the edge.",
    );
    return (
      <div class="demo-diagram">
        <Diagram
          nodes={NODES}
          edges={edges()}
          labels={{ diagram: "Payment flow, editable" }}
          onConnect={(from, to) => {
            setEdges((all) => [
              ...all,
              { id: `new-${all.length}`, from, to, label: `${labelOf(from)} → ${labelOf(to)}` },
            ]);
            setLog(`Edge “${labelOf(from)} → ${labelOf(to)}” made.`);
          }}
        />
        <p class="demo-text">
          <code>c</code> starts a link from the active node, the arrows pick the node it should join
          and Enter makes it; Escape forgets it. A drag from one node to another does the same, and
          the dashed line follows the pointer.
        </p>
        <p class="demo-text">{log()}</p>
      </div>
    );
  },
};

// Two diagonals of a square meet in the middle: the later edge is drawn with a break over the earlier one, so a reader can
// follow either line without a dot or a jump.
export const Crossings: Story = {
  name: "Crossings",
  render: (): JSX.Element => (
    <div class="demo-diagram">
      <Diagram
        nodes={[
          { id: "a", label: "A", x: 0, y: 0, width: 96, height: 44 },
          { id: "b", label: "B", x: 280, y: 0, width: 96, height: 44 },
          { id: "c", label: "C", x: 280, y: 220, width: 96, height: 44 },
          { id: "d", label: "D", x: 0, y: 220, width: 96, height: 44 },
        ]}
        edges={[
          { id: "ac", from: "a", to: "c" },
          { id: "bd", from: "b", to: "d" },
          { id: "ab", from: "a", to: "b" },
        ]}
        labels={{ diagram: "Two diagonals" }}
      />
      <p class="demo-text">
        The diagonals cross, so the second one carries a break: a stroke of the canvas's own colour
        under its line, wide enough to cut the first.
      </p>
    </div>
  ),
};

export const LayOut: Story = {
  name: "Laid out on demand",
  render: (): JSX.Element => (
    <DiagramStarter
      nodes={NODES}
      edges={STARTER_EDGES}
      labels={{ diagram: "Payment flow, laid out on demand" }}
      hint="The layout runs in the handler, with no worker: a graph this size is a few microseconds."
    />
  ),
};
