// The diagram's stories: a graph is data, so the meta has no component and the story composes it. The payment flow is the
// conformance fixture's own graph; the line under it is what the host heard, and the sentence before it says what the keys
// do. The drawing is plain SVG inside the component, so nothing is fetched.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { Diagram, type DiagramEdgeInput, type DiagramNodeInput } from "./diagram.tsx";

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
