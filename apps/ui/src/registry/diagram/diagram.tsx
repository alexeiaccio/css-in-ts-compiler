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

/** Where an edge's label goes, in the frame's own px: the band it has to stay inside. */
export interface DiagramLabelBand {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

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
  /**
   * Where each edge's label goes, when the host laid the graph out: a band keyed by `from>to` or `to>from`. An edge without
   * one keeps the skin's own place on its line, and a loop's label is always the skin's.
   */
  readonly labelSlots?: Readonly<Record<string, DiagramLabelBand>> | undefined;
  readonly class?: string | undefined;
}

/** The box a node gets when the caller gives no size: enough for a word or two. */
const NODE_WIDTH = 120;
const NODE_HEIGHT = 44;

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

// The visible line is thin and unfilled; the target is a wide transparent stroke over it, so a pointer can find an edge.
const lineClass = css.cn(css.fill("none"));

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
  /**
   * One port per edge on the border it leaves or arrives at, evenly spaced and ordered by the height of the other end, so two
   * edges from one node never share their stem; a loop takes one too, and its bracket is drawn on it.
   */
  const ports = createMemo(() => {
    const found = byId();
    const centreY = (id: string): number => {
      const box = found.get(id);
      return box === undefined ? 0 : box.y + (box.height ?? NODE_HEIGHT) / 2;
    };
    const outgoing = new Map<string, Array<{ id: string; far: number }>>();
    const incoming = new Map<string, Array<{ id: string; far: number }>>();
    for (const edge of props.edges) {
      if (found.get(edge.from) === undefined || found.get(edge.to) === undefined) continue;
      const out = outgoing.get(edge.from) ?? [];
      out.push({ id: edge.id, far: centreY(edge.to) });
      outgoing.set(edge.from, out);
      if (edge.from !== edge.to) {
        const into = incoming.get(edge.to) ?? [];
        into.push({ id: edge.id, far: centreY(edge.from) });
        incoming.set(edge.to, into);
      }
    }
    const anchors = (node: string, list: ReadonlyArray<{ id: string; far: number }>) => {
      const box = found.get(node);
      const height = box?.height ?? NODE_HEIGHT;
      const top = box?.y ?? 0;
      return [...list]
        .sort((one, two) => one.far - two.far || one.id.localeCompare(two.id))
        .map(
          (entry, index) => [entry.id, top + (height * (index + 1)) / (list.length + 1)] as const,
        );
    };
    const result = new Map<string, { from?: number; to?: number }>();
    for (const [node, list] of outgoing) {
      for (const [id, y] of anchors(node, list)) {
        result.set(id, { ...(result.get(id) ?? {}), from: y });
      }
    }
    for (const [node, list] of incoming) {
      for (const [id, y] of anchors(node, list)) {
        result.set(id, { ...(result.get(id) ?? {}), to: y });
      }
    }
    return result;
  });

  const bandOf = (edge: DiagramEdgeInput): DiagramLabelBand | undefined =>
    props.labelSlots?.[`${edge.from}>${edge.to}`] ?? props.labelSlots?.[`${edge.to}>${edge.from}`];

  const labelOf = (
    item: RoutedEdge,
  ): { readonly class: string; readonly x: number; readonly y: number } => {
    const band = bandOf(item.edge);
    if (band === undefined) {
      return {
        class: item.route.label.along ? labelAlongClass : labelClass,
        x: item.route.label.x,
        y: item.route.label.y,
      };
    }
    return { class: labelClass, x: band.x + band.width / 2, y: band.y + band.height / 2 + 4 };
  };

  // An edge whose endpoint is missing is the primitive's to ignore, and the skin's not to draw.
  const routed = createMemo<RoutedEdge[]>(() => {
    const found = byId();
    const shape = props.edge ?? "straight";
    const at = ports();
    return props.edges.flatMap((edge) => {
      const from = found.get(edge.from);
      const to = found.get(edge.to);
      const ends = at.get(edge.id) ?? {};
      const route =
        from === undefined || to === undefined
          ? undefined
          : shapeBetween(shape, { ...from, port: ends.from }, { ...to, port: ends.to });
      return route === undefined ? [] : [{ edge, route }];
    });
  });
  // The link being made, from the node it leaves to the node the tab stop is on, or to the landing the pointer's drag
  // reports. Both halves are the primitive's state; the skin draws the line they describe.
  const pendingRoute = createMemo<PathRoute | undefined>(() => {
    const from = diagram.connectFrom();
    const source = from === undefined ? undefined : byId().get(from);
    if (source === undefined) {
      return undefined;
    }
    const linking = diagram.linking();
    if (linking === undefined && diagram.active() === from) {
      return undefined;
    }
    const target =
      linking === undefined
        ? byId().get(diagram.active() ?? "")
        : linking.to === undefined
          ? { x: linking.point.x, y: linking.point.y, width: 0, height: 0 }
          : byId().get(linking.to);
    return target === undefined
      ? undefined
      : shapeBetween(props.edge ?? "straight", source, target);
  });

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
        {...diagram.frameProps}
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
                data-crossing={cutouts().has(item.edge.id) ? "true" : undefined}
                class={edgeClass}
              >
                <Show when={cutouts().has(item.edge.id)}>
                  <path class={cutoutClass} d={item.route.d} data-part="diagram-cutout" />
                </Show>
                <path class={hitClass} d={item.route.d} />
                <path class={lineClass} d={item.route.d} data-part="diagram-line" />
                <polygon points={item.route.arrow} />
                {item.edge.label === undefined ? undefined : (
                  <text {...labelOf(item)}>{item.edge.label}</text>
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
              data-part="diagram-node"
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
