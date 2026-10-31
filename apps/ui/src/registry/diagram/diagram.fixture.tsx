import { render } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Diagram, type DiagramEdgeInput, type DiagramNodeInput } from "./diagram.tsx";

/** A payment flow: four steps and the five ways between them. Not a state chart — any graph reads the same. */
export const PAYMENT_NODES: ReadonlyArray<DiagramNodeInput> = [
  { id: "cart", label: "Cart", x: 0, y: 24, width: 128, height: 48 },
  { id: "paid", label: "Paid", x: 196, y: 24, width: 128, height: 48 },
  { id: "shipped", label: "Shipped", x: 392, y: 24, width: 128, height: 48 },
  { id: "refunded", label: "Refunded", x: 196, y: 172, width: 128, height: 48 },
];

export const PAYMENT_EDGES: ReadonlyArray<DiagramEdgeInput> = [
  { id: "pay", from: "cart", to: "paid", label: "pay" },
  { id: "cancel", from: "cart", to: "refunded", label: "cancel" },
  { id: "ship", from: "paid", to: "shipped", label: "ship" },
  { id: "refund", from: "paid", to: "refunded", label: "refund" },
  { id: "resend", from: "refunded", to: "shipped", label: "resend" },
];

/** The one sentence the demo shows about the keys: the primitive's, in the demo's words. */
export const DIAGRAM_HINT =
  "Keys: the arrows move along the layout, Home and End jump to the ends, e lists the edges of the active node and Enter opens one. Tab leaves the diagram.";

/** The label of a node, the way the demo's line names it. */
export const nodeLabel = (id: string): string =>
  PAYMENT_NODES.find((node) => node.id === id)?.label ?? id;

/** An edge as one sentence: its label, and the two nodes it joins. */
export const edgeLabel = (id: string): string => {
  const edge = PAYMENT_EDGES.find((candidate) => candidate.id === id);
  return edge === undefined
    ? id
    : `Edge “${edge.label ?? edge.id}”: ${nodeLabel(edge.from)} → ${nodeLabel(edge.to)}.`;
};

/** What a mounted demo hands the test: where it lives, what the host was told, and a teardown. */
export interface MountedDiagram {
  readonly root: HTMLElement;
  /** Every node activation the host heard, in order. */
  readonly activated: ReadonlyArray<string>;
  /** Every edge activation the host heard, in order. */
  readonly fired: ReadonlyArray<string>;
  /** The line under the diagram: what the host was told, in the page's words. */
  readonly log: () => string;
  readonly dispose: () => void;
}

/**
 * Mounts the styled diagram in ordinary use: the payment flow, the sentence about the keys, and the line that says what the
 * host got. A button after the diagram is where Tab lands, so the demo shows that the tab stop leaves the graph.
 */
export const mountDiagram = (): MountedDiagram => {
  const root = document.createElement("div");
  document.body.append(root);
  const activated: string[] = [];
  const fired: string[] = [];
  const [log, setLog] = createSignal("Nothing activated yet: click a node, or press Enter on it.");

  const dispose = render(
    () => (
      <div style={{ display: "grid", gap: "12px" }}>
        <Diagram
          nodes={PAYMENT_NODES}
          edges={PAYMENT_EDGES}
          labels={{ diagram: "Payment flow" }}
          onActivate={(id) => {
            activated.push(id);
            setLog(`Node “${nodeLabel(id)}” activated.`);
          }}
          onEdge={(id) => {
            fired.push(id);
            setLog(edgeLabel(id));
          }}
        />
        <p data-part="diagram-hint" style={{ margin: "0", "font-size": "12px", color: "#666" }}>
          {DIAGRAM_HINT}
        </p>
        <p data-part="diagram-log" style={{ margin: "0", "font-size": "13px" }}>
          {log()}
        </p>
        <button type="button" data-part="diagram-after">
          After the diagram
        </button>
      </div>
    ),
    root,
  );

  return {
    root,
    activated,
    fired,
    log: () => root.querySelector('[data-part="diagram-log"]')?.textContent ?? "",
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
