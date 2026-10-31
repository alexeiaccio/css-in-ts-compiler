import {
  createDiagramFocus,
  type DiagramEdgeInput,
  type DiagramLabels,
  type DiagramNodeInput,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createMemo, For } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export type { DiagramEdgeInput, DiagramLabels, DiagramNodeInput };

/** The graph, the words for its live region, and what a node or an edge activation goes to. */
export interface DiagramProps {
  /**
   * The nodes, in the order Home and End walk. `width` / `height` size the node and its centre; left out, the skin uses
   * its own box (120 x 44).
   */
  readonly nodes: ReadonlyArray<DiagramNodeInput>;
  /** The edges, in option order; one whose endpoints are missing is neither drawn nor offered. */
  readonly edges: ReadonlyArray<DiagramEdgeInput>;
  /** The diagram's name in the live region, and the group's accessible name; the noun for the edges (default "edges"). */
  readonly labels?: DiagramLabels | undefined;
  /** Enter or Space on the active node, and a click on it. */
  readonly onActivate?: ((nodeId: string) => void) | undefined;
  /** Enter on the edge cursor, and a click on an edge's line or label. */
  readonly onEdge?: ((edgeId: string) => void) | undefined;
  readonly class?: string | undefined;
}

/** The box a node gets when the caller gives no size: enough for a word or two. */
const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;

/** A gap between a node's border and the line or the arrow's tip, so the arrow reads as pointing at the node. */
const EDGE_GAP = 4;

/** The arrow head's length along the line, and half its width. */
const ARROW = 8;
const ARROW_HALF = 3.2;

/** How far an edge's label sits above (or beside) the line. */
const LABEL_OFFSET = 8;

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Route {
  /** Where the line starts and ends: both trimmed to the nodes' borders. */
  readonly from: Point;
  readonly to: Point;
  /** The arrow's three points, as `<polygon points>`. */
  readonly arrow: string;
  /** Where the label goes, and which way its text runs from there. */
  readonly label: Point & { readonly along: boolean };
}

interface RoutedEdge {
  readonly edge: DiagramEdgeInput;
  readonly route: Route;
}

const round = (value: number): number => Math.round(value * 100) / 100;

const point = (x: number, y: number): Point => ({ x: round(x), y: round(y) });

const centreOf = (node: DiagramNodeInput): Point => ({
  x: node.x + (node.width ?? NODE_WIDTH) / 2,
  y: node.y + (node.height ?? NODE_HEIGHT) / 2,
});

/**
 * How far from a node's centre its border lies along a unit direction: the first of the two axis crossings, which is what
 * an axis-aligned rectangle meets.
 */
const borderOf = (node: DiagramNodeInput, ux: number, uy: number): number => {
  const halfWidth = (node.width ?? NODE_WIDTH) / 2;
  const halfHeight = (node.height ?? NODE_HEIGHT) / 2;
  const alongX = ux === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(ux);
  const alongY = uy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(uy);
  return Math.min(alongX, alongY);
};

/** The line from one node's border to the other's, the arrow at the target's end, and the label at the middle. */
const routeBetween = (from: DiagramNodeInput, to: DiagramNodeInput): Route | undefined => {
  const start = centreOf(from);
  const end = centreOf(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return undefined;
  }
  const ux = dx / length;
  const uy = dy / length;
  const lineFrom = borderOf(from, ux, uy) + EDGE_GAP;
  const tip = length - borderOf(to, ux, uy) - EDGE_GAP;
  const lineTo = tip - ARROW;
  if (lineTo <= lineFrom) {
    return undefined;
  }
  const at = (distance: number): Point => point(start.x + ux * distance, start.y + uy * distance);
  const head = at(tip);
  const side = { x: -uy * ARROW_HALF, y: ux * ARROW_HALF };
  const arrow = [
    head,
    point(head.x - ux * ARROW + side.x, head.y - uy * ARROW + side.y),
    point(head.x - ux * ARROW - side.x, head.y - uy * ARROW - side.y),
  ]
    .map((corner) => `${corner.x},${corner.y}`)
    .join(" ");
  const middle = at((lineFrom + lineTo) / 2);
  // a line that runs across the page gets its label above it, one that runs down gets it beside: either way the text does
  // not sit on the line
  const along = Math.abs(ux) < Math.abs(uy);
  return {
    from: at(lineFrom),
    to: at(lineTo),
    arrow,
    label: along
      ? { x: round(middle.x + LABEL_OFFSET), y: round(middle.y + 4), along }
      : { x: middle.x, y: round(middle.y - LABEL_OFFSET), along },
  };
};

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2), css.width("100%"));

// The frame is exactly the diagram's own coordinates: the SVG's viewBox and every node's left/top are in the same px, so a
// line and a node meet at the numbers the caller passed.
const frameClass = css.cn(css.position("relative"), css.flex("none"));

const edgesClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.display("block"),
  css.width("100%"),
  css.height("100%"),
  css.overflow("visible"),
);

// The edge group carries the colour for its line, arrow and label; the primitive's cursor is the one state that recolours
// it, read off `data-cursor` that the skin sets from `edgeCursor()`.
const edgeClass = css.cn(
  css.stroke(t.color.muted),
  css.fill(t.color.muted),
  css.strokeWidth("1.5"),
  css.strokeLinecap("round"),
  css.cursor("pointer"),
  css.attr("data-cursor", "true")(
    css.stroke(t.color.highlight),
    css.fill(t.color.highlight),
    css.strokeWidth("2"),
  ),
);

// The visible line is thin; the target is a wide transparent stroke over it, so a pointer can find an edge.
const hitClass = css.cn(
  css.stroke("transparent"),
  css.strokeWidth("14"),
  css.fill("none"),
  css.pointerEvents("stroke"),
);

const labelClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.fill(t.color.muted),
  css.textAnchor("middle"),
);

const labelAlongClass = css.cn(labelClass, css.textAnchor("start"));

// The primitive's roving tab stop is `tabindex="0"` on exactly one node: the active look needs no state of its own.
const nodeClass = css.cn(
  css.position("absolute"),
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.margin("0"),
  css.padding(t.space._2),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontFamily("inherit"),
  css.fontSize(t.font.size),
  css.fontWeight("500"),
  css.textAlign("center"),
  css.lineHeight(1.25),
  css.cursor("pointer"),
  css.transition("background-color 120ms, border-color 120ms"),
  css.hover(css.bg(t.color.buttonBackground), css.borderColor(t.color.borderHover)),
  css.attr("tabindex", "0")(
    css.bg(t.color.buttonBackground),
    css.borderColor(t.color.highlight),
    css.boxShadow("inset 0 0 0 1px", t.color.highlight),
  ),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const statusClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));

/**
 * A graph of nodes and edges, styled: `createDiagramFocus` owns one roving tab stop over the nodes (the arrows follow the
 * layout, Home / End jump, Tab leaves), the keyboard cursor over the active node's outgoing edges, and the polite live region
 * that says where the user is; the skin owns the geometry, the SVG lines behind the nodes, the tokens, the focus ring and
 * the active look it paints from `tabindex="0"`.
 *
 * A node is a button, positioned at its `x` / `y`; an edge is a line under the nodes, from border to border, with an arrow
 * head and its label, and a click on one is `onEdge` — the same activation the keyboard's edge cursor gives.
 */
export const Diagram = (props: DiagramProps): JSX.Element => {
  const nodes = createMemo(() =>
    props.nodes.map((node) => ({
      ...node,
      width: node.width ?? NODE_WIDTH,
      height: node.height ?? NODE_HEIGHT,
    })),
  );
  const diagram = createDiagramFocus({
    get nodes() {
      return nodes();
    },
    get edges() {
      return props.edges;
    },
    get labels() {
      return props.labels;
    },
    get onActivate() {
      return props.onActivate;
    },
    get onEdgeActivate() {
      return props.onEdge;
    },
  });

  // the ids the edges name, and the frame the nodes fill
  const byId = createMemo(() => new Map(nodes().map((node) => [node.id, node])));
  const bounds = createMemo(() =>
    nodes().reduce(
      (box, node) => ({
        width: Math.max(box.width, node.x + (node.width ?? NODE_WIDTH)),
        height: Math.max(box.height, node.y + (node.height ?? NODE_HEIGHT)),
      }),
      { width: 0, height: 0 },
    ),
  );
  // An edge whose endpoint is missing is the primitive's to ignore, and the skin's not to draw.
  const routed = createMemo<RoutedEdge[]>(() => {
    const found = byId();
    return props.edges.flatMap((edge) => {
      const from = found.get(edge.from);
      const to = found.get(edge.to);
      const route = from === undefined || to === undefined ? undefined : routeBetween(from, to);
      return route === undefined ? [] : [{ edge, route }];
    });
  });
  // the edge the primitive's cursor is on, for the one look the keyboard moves
  const cursor = (edgeId: string): "true" | undefined => {
    const outgoing = diagram.edgesOf(diagram.active() ?? "");
    const at = outgoing.findIndex((edge) => edge.id === edgeId);
    return at >= 0 && at === diagram.edgeCursor() ? "true" : undefined;
  };

  return (
    <div
      role="group"
      aria-label={props.labels?.diagram ?? "Diagram"}
      data-part="diagram"
      class={css.cn(rootClass, props.class)}
    >
      <div
        data-part="diagram-frame"
        class={frameClass}
        style={{ width: `${bounds().width}px`, height: `${bounds().height}px` }}
      >
        <svg
          data-part="diagram-edges"
          class={edgesClass}
          viewBox={`0 0 ${bounds().width} ${bounds().height}`}
        >
          <For each={routed()}>
            {(item) => (
              <g
                {...diagram.edgeProps(item.edge.id)}
                data-part="diagram-edge"
                data-edge={item.edge.id}
                data-cursor={cursor(item.edge.id)}
                class={edgeClass}
              >
                <line
                  class={hitClass}
                  x1={item.route.from.x}
                  y1={item.route.from.y}
                  x2={item.route.to.x}
                  y2={item.route.to.y}
                />
                <line
                  x1={item.route.from.x}
                  y1={item.route.from.y}
                  x2={item.route.to.x}
                  y2={item.route.to.y}
                />
                <polygon points={item.route.arrow} />
                {item.edge.label === undefined ? undefined : (
                  <text
                    class={item.route.label.along ? labelAlongClass : labelClass}
                    x={item.route.label.x}
                    y={item.route.label.y}
                  >
                    {item.edge.label}
                  </text>
                )}
              </g>
            )}
          </For>
        </svg>
        <For each={nodes()}>
          {(node) => (
            <button
              type="button"
              {...diagram.nodeProps(node.id)}
              data-part="diagram-node"
              data-node={node.id}
              class={nodeClass}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width ?? NODE_WIDTH}px`,
                height: `${node.height ?? NODE_HEIGHT}px`,
              }}
            >
              {node.label}
            </button>
          )}
        </For>
      </div>
      <p {...diagram.statusProps} data-part="diagram-status" class={statusClass}>
        {diagram.status()}
      </p>
    </div>
  );
};
