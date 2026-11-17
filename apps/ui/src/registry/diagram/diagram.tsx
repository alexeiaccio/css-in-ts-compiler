import {
  createDiagramFocus,
  type DiagramEdgeInput,
  type DiagramLabels,
  type DiagramNodeInput,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createMemo, createSignal, For, Show } from "solid-js";

import { crossingsOf, type EdgeShape, type PathRoute, shapeBetween } from "../route.ts";
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
  /** How a line is drawn (default `straight`): the four shapes a node UI is read in. */
  readonly edge?: EdgeShape | undefined;
  /** The diagram's name in the live region, and the group's accessible name; the noun for the edges (default "edges"). */
  readonly labels?: DiagramLabels | undefined;
  /** Enter or Space on the active node, and a click on it. */
  readonly onActivate?: ((nodeId: string) => void) | undefined;
  /** Enter on the edge cursor, and a click on an edge's line or label. */
  readonly onEdge?: ((edgeId: string) => void) | undefined;
  /**
   * A link was made, by `c` and Enter or by dragging from one node to another: the host's to keep. The skin draws the
   * pending link and hands the pair over; it does not add the edge itself.
   */
  readonly onConnect?: ((from: string, to: string) => void) | undefined;
  /** Whether a link may be made (default: any other node). */
  readonly canConnect?: ((from: string, to: string) => boolean) | undefined;
  readonly class?: string | undefined;
}

/** The box a node gets when the caller gives no size: enough for a word or two. */
const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;

/** How far a press must move before it is a drag that makes a link, rather than a click that activates a node. */
const DRAG_THRESHOLD = 6;

interface RoutedEdge {
  readonly edge: DiagramEdgeInput;
  readonly route: PathRoute;
}

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2), css.width("100%"));

// The frame is exactly the diagram's own coordinates: the SVG's viewBox and every node's left/top are in the same px, so a
// line and a node meet at the numbers the caller passed. It is also the canvas a crossing breaks against: the edge drawn
// over another cuts it with this colour.
const frameClass = css.cn(
  css.position("relative"),
  css.flex("none"),
  css.bg(t.color.surface),
  css.borderRadius(t.radius.md),
);

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

// A crossing is a break, not a dot: the edge drawn later is what a reader sees continuous, so it carries a stroke of the
// canvas's own colour under its line, wide enough to cut the one beneath. Nothing is painted over the nodes — they are DOM
// after the SVG.
const cutoutClass = css.cn(
  css.stroke(t.color.surface),
  css.strokeWidth("6"),
  css.fill("none"),
  css.pointerEvents("none"),
);

// The link that is being made: dashed, in the accent, from the node it leaves to the pointer (a drag) or to the node the
// keyboard's tab stop is on (Enter will make it).
const pendingClass = css.cn(
  css.stroke(t.color.highlight),
  css.strokeWidth("1.5"),
  css.strokeDasharray("5 4"),
  css.fill("none"),
  css.pointerEvents("none"),
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
 * A node is a button, positioned at its `x` / `y`; an edge is a path under the nodes, from border to border, with an arrow
 * head and its label, and a click on one is `onEdge` — the same activation the keyboard's edge cursor gives. Where two edges
 * cross, the later one is drawn with a break over the earlier one, which is the oldest convention a diagram has for
 * "these two lines do not meet".
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
    get onConnect() {
      return props.onConnect;
    },
    get canConnect() {
      return props.canConnect;
    },
  });

  // A pointer drag is the second way to make a link: a press is a click until it has moved DRAG_THRESHOLD px, and only
  // then does the primitive learn about it, so a click still activates the node.
  let press:
    | { readonly id: string; readonly x: number; readonly y: number; moved: boolean }
    | undefined;
  let suppressClick = false;
  const [pointer, setPointer] = createSignal<{ readonly x: number; readonly y: number }>();

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
    const shape = props.edge ?? "straight";
    return props.edges.flatMap((edge) => {
      const from = found.get(edge.from);
      const to = found.get(edge.to);
      const route =
        from === undefined || to === undefined ? undefined : shapeBetween(shape, from, to);
      return route === undefined ? [] : [{ edge, route }];
    });
  });
  // The link being made, from the node it leaves to the node the tab stop is on, or to the pointer while one is dragged.
  const pendingRoute = createMemo<PathRoute | undefined>(() => {
    const from = diagram.connectFrom();
    const source = from === undefined ? undefined : byId().get(from);
    if (source === undefined) {
      return undefined;
    }
    const at = pointer();
    const target =
      at === undefined
        ? byId().get(diagram.active() ?? "")
        : { x: at.x, y: at.y, width: 0, height: 0 };
    return target === undefined
      ? undefined
      : shapeBetween(props.edge ?? "straight", source, target);
  });

  const local = (event: PointerEvent, frame: Element): { x: number; y: number } => {
    const box = frame.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const pointerDown = (event: PointerEvent, id: string): void => {
    suppressClick = false;
    press = { id, x: event.clientX, y: event.clientY, moved: false };
  };

  const pointerMove = (event: PointerEvent): void => {
    if (press === undefined) {
      return;
    }
    if (!press.moved) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_THRESHOLD) {
        return;
      }
      press.moved = true;
      diagram.startConnect(press.id);
    }
    setPointer(local(event, event.currentTarget as Element));
  };

  const pointerUp = (event: PointerEvent): void => {
    const moved = press?.moved === true;
    press = undefined;
    setPointer(undefined);
    if (!moved) {
      return;
    }
    // the release is over the target, so the click that follows a drag is not an activation
    suppressClick = true;
    const element = event.target instanceof Element ? event.target.closest("[data-node]") : null;
    const to = element instanceof HTMLElement ? element.dataset.node : undefined;
    if (to === undefined || !diagram.connectTo(to)) {
      diagram.cancelConnect();
    }
  };

  // The edges that are drawn over another one: each carries the canvas-coloured stroke that breaks the line beneath it.
  const cutouts = createMemo(
    () =>
      new Set(
        crossingsOf(routed().map((item) => ({ id: item.edge.id, route: item.route }))).map(
          (crossing) => crossing.over,
        ),
      ),
  );
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
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
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
                data-crossing={cutouts().has(item.edge.id) ? "true" : undefined}
                class={edgeClass}
              >
                <Show when={cutouts().has(item.edge.id)}>
                  <path class={cutoutClass} d={item.route.d} data-part="diagram-cutout" />
                </Show>
                <path class={hitClass} d={item.route.d} />
                <path d={item.route.d} />
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
          <For each={pendingRoute() === undefined ? [] : [pendingRoute()!]}>
            {(route) => (
              <path
                class={pendingClass}
                d={route.d}
                data-part="diagram-pending"
                aria-hidden="true"
              />
            )}
          </For>
        </svg>
        <For each={nodes()}>
          {(node) => (
            <button
              type="button"
              {...diagram.nodeProps(node.id)}
              onClick={(event) => {
                if (suppressClick) {
                  suppressClick = false;
                  event.preventDefault();
                  return;
                }
                diagram.nodeProps(node.id).onClick();
              }}
              onPointerDown={(event) => pointerDown(event, node.id)}
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
