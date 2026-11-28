import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import {
  Diagram,
  type DiagramEdgeInput,
  type DiagramLabels,
  type DiagramNodeInput,
} from "./diagram.tsx";
import { layOut } from "./layout.ts";

/** What the starter holds: the graph, the words the live region uses, and the sentence under the control. */
export interface DiagramStarterProps {
  readonly nodes: ReadonlyArray<DiagramNodeInput>;
  readonly edges: ReadonlyArray<DiagramEdgeInput>;
  readonly labels?: DiagramLabels | undefined;
  readonly hint?: string | undefined;
}

const NOT_LAID = "The graph is where its author put it. “Lay out” runs the layered layout on it.";

/**
 * The diagram, its graph in the host's state, and one control that lays that graph out. The button is a real button, so it is
 * labelled, keyboard operable and outside the diagram's own tab stop; pressing it twice draws the same picture, because the
 * graph it reads is the one it wrote.
 *
 * @param {DiagramStarterProps} props the graph and its words
 * @returns {JSX.Element} the starter
 */
export const DiagramStarter = (props: DiagramStarterProps): JSX.Element => {
  const [nodes, setNodes] = createSignal(props.nodes);
  const [log, setLog] = createSignal(NOT_LAID);
  return (
    <div class="demo-diagram">
      <Diagram nodes={nodes()} edges={props.edges} labels={props.labels} />
      <div class="demo-row">
        <button
          type="button"
          data-part="starter-lay-out"
          onClick={() => {
            setNodes((current) => layOut(current, props.edges));
            setLog("Laid out: layers left to right, boxes aligned, crossings minimized.");
          }}
        >
          Lay out
        </button>
        <span class="demo-text">{props.hint}</span>
      </div>
      <p class="demo-text">{log()}</p>
    </div>
  );
};
