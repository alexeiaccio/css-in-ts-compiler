import { type Accessor, createSignal, createUniqueId } from "solid-js";

/**
 * A diagram of nodes and edges on Solid 2: one roving tab stop over the nodes,
 * a keyboard cursor over the active node's outgoing edges, and one polite live
 * region that says where the user is. State plus attribute objects, no
 * elements, no styling.
 *
 * **There is no APG pattern for a diagram**, so there is no Quint spec and no
 * ported scenarios: `test/diagram.browser.test.tsx` is its oracle. What it
 * borrows: the grid's roving tabindex (exactly one node in the tab order and
 * Tab leaves the composite), `aria-roledescription="node"` on each node
 * (WAI-ARIA's way to say what a `role="button"` is in this composite), and the
 * `role="status"` polite live region of `createStatus` for the announcement.
 *
 * **A diagram is never mouse-only.** A canvas positions its nodes with drag and
 * its edges with a pointer; a keyboard user gets the same graph through the
 * arrows (geometrically nearest node in that direction, wrapping when nothing
 * lies that way), Home / End, and `e` for the active node's outgoing edges.
 * A move also focuses the node it lands on, through the `id` `nodeProps` puts
 * on each element, so the tab stop and the focused element always agree.
 *
 * **And an edge is never pointer-only either** — the one thing the big node
 * libraries leave out. `c` starts a link from the active node, the arrows pick
 * the node it should join (the tab stop is the target, so the live region names
 * it), Enter makes the edge and Escape forgets it; the same pending state is
 * what a pointer drag reports to, so both halves draw one line and announce the
 * same thing.
 *
 * Geometry is owned by the host and is read, not written: `x`/`y` are the
 * node's top-left in diagram space, `width`/`height` only size its centre. The
 * host renders the nodes and the edges wherever it likes; this primitive only
 * computes what to focus and what to announce, and focuses the element it lands
 * on (the host's own document; a portal elsewhere is the host's to focus).
 *
 * ponytail: nodes are buttons, not a tree; a nested diagram, multi-select and
 * zoom/pan announcement are not modelled. Add them when a consumer needs them.
 */

export interface DiagramNodeInput {
  readonly id: string;
  /** The accessible name, and the name the live region uses. */
  readonly label: string;
  /** The node's top-left in diagram space. */
  readonly x: number;
  readonly y: number;
  /** Only used to compute the centre; 0 when absent. */
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

export interface DiagramEdgeInput {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  /** Named in the edge's accessible name and its announcement ("refund"). */
  readonly label?: string | undefined;
}

export interface DiagramLabels {
  /**
   * The diagram's name, prefixed to every announcement ("State chart. Payment.
   * 2 edges: …"). Absent, the region says only the node or edge.
   */
  readonly diagram?: string | undefined;
  /** The plural noun for a node's outgoing edges ("transitions"); default "edges". */
  readonly edges?: string | undefined;
}

export interface DiagramOptions {
  /**
   * The nodes, in option order (what Home / End name). Pass a getter
   * (`() => nodes()`) when the list arrives later or changes: it is read at
   * attribute-read time, and the tab stop survives a change as long as its node
   * does.
   */
  readonly nodes: ReadonlyArray<DiagramNodeInput> | (() => ReadonlyArray<DiagramNodeInput>);
  /** The edges, in option order; one whose endpoints are missing is ignored. */
  readonly edges: ReadonlyArray<DiagramEdgeInput> | (() => ReadonlyArray<DiagramEdgeInput>);
  /** Enter or Space on the active node. */
  readonly onActivate?: ((nodeId: string) => void) | undefined;
  /** Enter on the edge cursor, or a click on an edge. */
  readonly onEdgeActivate?: ((edgeId: string) => void) | undefined;
  /** Enter, or a pointer release, on a node while a link from another one is pending: make that edge. */
  readonly onConnect?: ((from: string, to: string) => void) | undefined;
  /**
   * Whether a link from `from` to `to` is allowed (default: any other node). A refusal keeps the link pending, so the
   * reader can pick another target; the live region says the pair is not allowed.
   */
  readonly canConnect?: ((from: string, to: string) => boolean) | undefined;
  /**
   * How far, in screen px, a press must travel before it is a drag rather than
   * a click. Default 4: the pointer machine's `DRAG_PX` (`pointer.qnt`), so a
   * pointer drag has one threshold in the kit and not one per skin.
   */
  readonly dragThreshold?: number | undefined;
  readonly labels?: DiagramLabels | undefined;
  /**
   * Base for the nodes' element ids (`<id>-node-<node id>`), which is how a
   * keyboard move focuses the node it landed on. Generated when absent; give
   * one when the host needs a stable id across a remount.
   */
  readonly id?: string | undefined;
}

/** Spread onto the element that draws one node. */
export interface DiagramNodeProps {
  readonly "data-part": string;
  /** The node's id, for a hit test: the pointer drag finds the node it lands on by this attribute. */
  readonly "data-node": string;
  /** The element id a keyboard move focuses; set it by spreading, never by hand. */
  readonly id: string;
  readonly role: "button";
  readonly "aria-roledescription": "node";
  readonly "aria-label": string;
  readonly tabindex: 0 | -1;
  /** Whether a release would make the pending link to this node; absent when no link is pending. */
  readonly "data-link-target"?: "allowed" | "blocked" | undefined;
  readonly onFocus: () => void;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  /** Starts the pointer half of a link; the frame's `frameProps` end it. */
  readonly onPointerDown: (event: PointerEvent) => void;
}

/**
 * Spread onto the element that draws the nodes: it hears the moves and the release a pointer drag that started on a
 * node sends, and it is the frame the pointer is measured in.
 */
export interface DiagramFrameProps {
  readonly "data-part": "frame";
  readonly ref: (element: Element | undefined) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
  readonly onLostPointerCapture: (event: PointerEvent) => void;
}

/**
 * The link a pointer release would make right now — the declarative half of a drag: the source, the pointer in diagram
 * px, the node it is over when it is over one, and whether a release would make that edge.
 */
export interface DiagramLinking {
  readonly from: string;
  readonly point: { readonly x: number; readonly y: number };
  readonly to?: string | undefined;
  readonly allowed: boolean;
}

/** Spread onto the element that draws one edge. */
export interface DiagramEdgeProps {
  readonly "data-part": string;
  readonly role: "button";
  readonly "aria-label": string;
  readonly tabindex: -1;
  readonly onClick: () => void;
}

/** Spread onto the element that carries the announcement; render it once, always. */
export interface DiagramStatusProps {
  readonly "data-part": string;
  readonly role: "status";
  readonly "aria-live": "polite";
}

export interface DiagramFocus {
  /** The node holding the roving tab stop; `undefined` when the diagram is empty. */
  readonly active: Accessor<string | undefined>;
  /** Move the tab stop and focus that node; a node that is not in `nodes` is a no-op. Returns where it landed. */
  readonly focus: (id: string) => string | undefined;
  readonly nodeProps: (id: string) => DiagramNodeProps;
  readonly edgeProps: (id: string) => DiagramEdgeProps;
  /** The outgoing edges of a node, in option order, endpoints present. */
  readonly edgesOf: (id: string) => ReadonlyArray<DiagramEdgeInput>;
  /** The edge cursor: an index into `edgesOf(active())`, or -1 when off. */
  readonly edgeCursor: Accessor<number>;
  readonly setEdgeCursor: (index: number) => void;
  /** What a polite live region says now; empty while the diagram is empty. */
  readonly status: Accessor<string>;
  readonly statusProps: DiagramStatusProps;
  readonly frameProps: DiagramFrameProps;
  /**
   * The link a pointer drag would make now: absent until the press has travelled `dragThreshold`, and undefined again
   * once it is released. The keyboard's pending link is `connectFrom`, not this.
   */
  readonly linking: Accessor<DiagramLinking | undefined>;
  /** The node a link is being made from, or `undefined` when no link is pending. */
  readonly connectFrom: Accessor<string | undefined>;
  /** Start a link from `id`, or from the active node when it is left out. A node that does not exist is a no-op. */
  readonly startConnect: (id?: string) => void;
  /** Forget the pending link, making no edge. */
  readonly cancelConnect: () => void;
  /**
   * Make the pending link to `id` if `canConnect` allows it, and forget it: what Enter does, and what a host's pointer
   * gesture reports on release. Returns whether an edge was asked for.
   */
  readonly connectTo: (id: string) => boolean;
}

type Direction = "up" | "down" | "left" | "right";

const ARROWS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

const isActivation = (key: string): boolean => key === "Enter" || key === " " || key === "Spacebar";

const directionOf = (key: string): Direction | undefined => {
  if (key === "ArrowUp") {
    return "up";
  }
  if (key === "ArrowDown") {
    return "down";
  }
  if (key === "ArrowLeft") {
    return "left";
  }
  if (key === "ArrowRight") {
    return "right";
  }
  return undefined;
};

const centreOf = (node: DiagramNodeInput): { x: number; y: number } => ({
  x: node.x + (node.width ?? 0) / 2,
  y: node.y + (node.height ?? 0) / 2,
});

/** Centres in the half-plane the direction names: right is `dx > 0`, and so on. */
const qualifies = (direction: Direction, dx: number, dy: number): boolean => {
  if (direction === "right") {
    return dx > 0;
  }
  if (direction === "left") {
    return dx < 0;
  }
  if (direction === "down") {
    return dy > 0;
  }
  return dy < 0;
};

/**
 * The nearest node whose centre lies in the direction's half-plane: smallest
 * squared distance from the active centre, ties by id. Squared, so a grid's
 * integer layout compares exactly.
 */
const nearestIn = (
  nodes: ReadonlyArray<DiagramNodeInput>,
  from: DiagramNodeInput,
  direction: Direction,
): DiagramNodeInput | undefined => {
  const origin = centreOf(from);
  let best: DiagramNodeInput | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    if (node.id === from.id) {
      continue;
    }
    const centre = centreOf(node);
    const dx = centre.x - origin.x;
    const dy = centre.y - origin.y;
    if (!qualifies(direction, dx, dy)) {
      continue;
    }
    const distance = dx * dx + dy * dy;
    if (
      best === undefined ||
      distance < bestDistance ||
      (distance === bestDistance && node.id < best.id)
    ) {
      best = node;
      bestDistance = distance;
    }
  }
  return best;
};

/**
 * Nothing lies that way, so wrap to the opposite end: the extreme of the axis
 * the direction runs along (right/left wrap along x, down/up along y), the
 * smallest id winning a tie — which in a one-node diagram is the node itself.
 */
const oppositeEnd = (
  nodes: ReadonlyArray<DiagramNodeInput>,
  direction: Direction,
): DiagramNodeInput | undefined => {
  let best: DiagramNodeInput | undefined;
  let bestValue = direction === "right" || direction === "down" ? Number.POSITIVE_INFINITY : 0;
  for (const node of nodes) {
    const centre = centreOf(node);
    const value = direction === "left" || direction === "right" ? centre.x : centre.y;
    const extreme =
      direction === "right" || direction === "down" ? value < bestValue : value > bestValue;
    if (best === undefined || extreme || (value === bestValue && node.id < best.id)) {
      best = node;
      bestValue = value;
    }
  }
  return best;
};

const ARROW = "\u2192";

export const createDiagramFocus = (options: DiagramOptions): DiagramFocus => {
  const base = options.id ?? createUniqueId();
  const elementId = (nodeId: string): string => `${base}-node-${nodeId}`;
  /**
   * The tab stop moved, so focus follows it: the host spreads `nodeProps`, so
   * the element exists under the id the primitive just gave it. A node rendered
   * outside this document (a portal) is the host's to focus.
   */
  const focusElement = (nodeId: string): void => {
    if (typeof document === "undefined") {
      return;
    }
    const element = document.getElementById(elementId(nodeId));
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };
  const nodeSource = (): ReadonlyArray<DiagramNodeInput> =>
    typeof options.nodes === "function" ? options.nodes() : options.nodes;
  const edgeSource = (): ReadonlyArray<DiagramEdgeInput> =>
    typeof options.edges === "function" ? options.edges() : options.edges;
  const [stored, setStored] = createSignal<string | undefined>();
  const [cursor, setCursor] = createSignal(-1);
  const [pending, setPending] = createSignal<string | undefined>();

  const nodeOf = (id: string): DiagramNodeInput | undefined =>
    nodeSource().find((node) => node.id === id);

  /** The edges whose both endpoints exist; the rest are ignored. */
  const edgeList = (): ReadonlyArray<DiagramEdgeInput> => {
    const ids = new Set(nodeSource().map((node) => node.id));
    return edgeSource().filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  };

  const edgesOf = (id: string): ReadonlyArray<DiagramEdgeInput> =>
    edgeList().filter((edge) => edge.from === id);

  /**
   * The stored tab stop while its node still exists, else the first node, so a
   * list that arrives later starts on its first node and a node that goes away
   * cannot leave the tab stop nowhere.
   */
  const active = (): string | undefined => {
    const nodes = nodeSource();
    const id = stored();
    if (id !== undefined && nodes.some((node) => node.id === id)) {
      return id;
    }
    return nodes[0]?.id;
  };

  const edgeCursor = (): number => {
    const index = cursor();
    const id = active();
    if (index < 0 || id === undefined) {
      return -1;
    }
    return index < edgesOf(id).length ? index : -1;
  };

  const labelOf = (id: string): string => nodeOf(id)?.label ?? id;

  /** The pending source, once it still names a node: a node that goes away cannot hold a link open. */
  const connectFrom = (): string | undefined => {
    const from = pending();
    return from !== undefined && nodeOf(from) !== undefined ? from : undefined;
  };

  const allowed = (from: string, to: string): boolean =>
    to !== from && nodeOf(to) !== undefined && (options.canConnect?.(from, to) ?? true);

  const threshold = options.dragThreshold ?? 4;
  let frame: Element | undefined;
  let press: { id: string; x: number; y: number; moved: boolean } | undefined;
  let suppressClick = false;
  const [landing, setLanding] = createSignal<
    { x: number; y: number; to: string | undefined } | undefined
  >();

  /** The node under a screen point: the element the host marked with `data-node`, nowhere a node is not drawn. */
  const nodeAt = (clientX: number, clientY: number): string | undefined => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const element = document.elementFromPoint(clientX, clientY);
    const node = element?.closest("[data-node]");
    const id = node instanceof HTMLElement ? node.dataset.node : undefined;
    return id !== undefined && nodeOf(id) !== undefined ? id : undefined;
  };

  const pointOf = (event: PointerEvent): { x: number; y: number } => {
    const rect = frame?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const pointerDown = (event: PointerEvent, id: string): void => {
    if (event.button !== 0 || nodeOf(id) === undefined) {
      return;
    }
    press = { id, x: event.clientX, y: event.clientY, moved: false };
    suppressClick = false;
    try {
      if (event.currentTarget instanceof Element) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    } catch {
      return;
    }
  };

  const pointerMove = (event: PointerEvent): void => {
    if (press === undefined) {
      return;
    }
    if (!press.moved) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < threshold) {
        return;
      }
      press.moved = true;
      startConnect(press.id);
    }
    const point = pointOf(event);
    setLanding({ ...point, to: nodeAt(event.clientX, event.clientY) });
  };

  const endPress = (): boolean => {
    const moved = press?.moved === true;
    press = undefined;
    setLanding(undefined);
    return moved;
  };

  const pointerUp = (event: PointerEvent): void => {
    const source = press?.id;
    if (!endPress() || source === undefined) {
      return;
    }
    suppressClick = true;
    const to = nodeAt(event.clientX, event.clientY);
    if (to === undefined || !join(source, to)) {
      cancelConnect();
    }
  };

  const pointerCancel = (): void => {
    if (endPress()) {
      suppressClick = true;
    }
    cancelConnect();
  };

  const frameProps: DiagramFrameProps = {
    "data-part": "frame",
    ref: (element) => {
      frame = element ?? undefined;
    },
    onPointerMove: pointerMove,
    onPointerUp: pointerUp,
    onPointerCancel: pointerCancel,
    onLostPointerCapture: pointerCancel,
  };

  const linking = (): DiagramLinking | undefined => {
    const from = connectFrom();
    const at = landing();
    if (from === undefined || at === undefined) {
      return undefined;
    }
    const to = at.to;
    return {
      from,
      point: { x: at.x, y: at.y },
      ...(to === undefined ? {} : { to }),
      allowed: to !== undefined && allowed(from, to),
    };
  };

  const edgesNoun = (): string => options.labels?.edges ?? "edges";

  const nodeSentence = (id: string): string => {
    const outgoing = edgesOf(id);
    const plural = edgesNoun();
    if (outgoing.length === 0) {
      return `${labelOf(id)}. No ${plural}.`;
    }
    const singular = plural.endsWith("s") ? plural.slice(0, -1) : plural;
    const noun = outgoing.length === 1 ? singular : plural;
    const targets = outgoing.map((edge) => `to ${labelOf(edge.to)}`).join(", ");
    return `${labelOf(id)}. ${outgoing.length} ${noun}: ${targets}.`;
  };

  const edgeSentence = (edge: DiagramEdgeInput): string => {
    const name = edge.label === undefined ? "" : ` (${edge.label})`;
    return `Edge ${labelOf(edge.from)} ${ARROW} ${labelOf(edge.to)}${name}. Enter to activate.`;
  };

  const status = (): string => {
    const from = connectFrom();
    const prefix = options.labels?.diagram === undefined ? "" : `${options.labels.diagram}. `;
    if (from !== undefined) {
      // the tab stop *is* the target while a link is pending, so a move is a choice and the region says the pair
      const to = active();
      if (to === undefined) {
        return `${prefix}Link from ${labelOf(from)}. Escape to cancel.`;
      }
      const sentence = allowed(from, to)
        ? `Link ${labelOf(from)} to ${labelOf(to)}. Enter to connect, Escape to cancel.`
        : `Link ${labelOf(from)} to ${labelOf(to)}: not allowed. Escape to cancel.`;
      return prefix + sentence;
    }
    const id = active();
    if (id === undefined) {
      return "";
    }
    const index = edgeCursor();
    const edge = index < 0 ? undefined : edgesOf(id)[index];
    const sentence = edge === undefined ? nodeSentence(id) : edgeSentence(edge);
    const diagram = options.labels?.diagram;
    return diagram === undefined ? sentence : `${diagram}. ${sentence}`;
  };

  const move = (fromId: string, direction: Direction | undefined): void => {
    if (direction === undefined) {
      return;
    }
    const from = nodeOf(fromId);
    if (from === undefined) {
      return;
    }
    const nodes = nodeSource();
    const target = nearestIn(nodes, from, direction) ?? oppositeEnd(nodes, direction);
    if (target !== undefined) {
      setStored(target.id);
      focusElement(target.id);
    }
  };

  const focus = (id: string): string | undefined => {
    if (nodeOf(id) === undefined) {
      return active();
    }
    setStored(id);
    setCursor(-1);
    focusElement(id);
    return id;
  };

  const setEdgeCursor = (index: number): void => {
    const id = active();
    if (id === undefined) {
      return;
    }
    if (index < 0) {
      setCursor(-1);
      return;
    }
    if (index < edgesOf(id).length) {
      setCursor(index);
    }
  };

  const startConnect = (id?: string): void => {
    const from = id ?? active();
    if (from === undefined || nodeOf(from) === undefined) {
      return;
    }
    setPending(from);
    setCursor(-1);
  };

  const cancelConnect = (): void => {
    setPending(undefined);
  };

  const join = (from: string, to: string): boolean => {
    if (!allowed(from, to)) {
      return false;
    }
    setPending(undefined);
    options.onConnect?.(from, to);
    return true;
  };

  const connectTo = (id: string): boolean => {
    const from = connectFrom();
    return from === undefined ? false : join(from, id);
  };

  const keyDown = (id: string, event: KeyboardEvent): void => {
    if (nodeOf(id) === undefined) {
      return;
    }
    if (active() !== id) {
      setStored(id);
      setCursor(-1);
    }
    const key = event.key;
    if (connectFrom() !== undefined) {
      if (key === "Escape") {
        event.preventDefault();
        cancelConnect();
        return;
      }
      if (isActivation(key)) {
        event.preventDefault();
        connectTo(id);
        return;
      }
      if (key.toLowerCase() === "e" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // the edge cursor belongs to the node, not to a link: Enter is spoken for
        event.preventDefault();
        return;
      }
    }
    const outgoing = edgesOf(id);
    const raw = cursor();
    const index = raw >= 0 && raw < outgoing.length ? raw : -1;
    if (index >= 0) {
      if (key === "Escape") {
        event.preventDefault();
        setCursor(-1);
        return;
      }
      if (isActivation(key)) {
        event.preventDefault();
        const edge = outgoing[index];
        if (edge !== undefined) {
          options.onEdgeActivate?.(edge.id);
        }
        return;
      }
      if (ARROWS.has(key)) {
        event.preventDefault();
        const step = key === "ArrowDown" || key === "ArrowRight" ? 1 : -1;
        setCursor((index + step + outgoing.length) % outgoing.length);
        return;
      }
      if (key.toLowerCase() === "e" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setCursor(-1);
        return;
      }
      // Any other navigation key leaves the cursor and then does its node thing.
      setCursor(-1);
    }
    if (ARROWS.has(key)) {
      event.preventDefault();
      move(id, directionOf(key));
      return;
    }
    if (key === "Home" || key === "End") {
      event.preventDefault();
      const nodes = nodeSource();
      const target = key === "Home" ? nodes[0] : nodes[nodes.length - 1];
      if (target !== undefined) {
        setStored(target.id);
        focusElement(target.id);
      }
      return;
    }
    if (isActivation(key)) {
      event.preventDefault();
      options.onActivate?.(id);
      return;
    }
    if (key.toLowerCase() === "e" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      setCursor(edgesOf(id).length === 0 ? -1 : 0);
      return;
    }
    if (key.toLowerCase() === "c" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      startConnect(id);
    }
  };

  return {
    active,
    focus,
    nodeProps: (id) => {
      const node = nodeOf(id);
      if (node === undefined) {
        return {
          "data-part": "node",
          "data-node": id,
          id: elementId(id),
          role: "button",
          "aria-roledescription": "node",
          "aria-label": "",
          tabindex: -1,
          onFocus: () => {},
          onClick: () => {},
          onKeyDown: () => {},
          onPointerDown: () => {},
        };
      }
      const from = connectFrom();
      const target =
        from === undefined || from === id ? undefined : allowed(from, id) ? "allowed" : "blocked";
      return {
        "data-part": "node",
        "data-node": id,
        id: elementId(id),
        role: "button",
        "aria-roledescription": "node",
        "aria-label": node.label,
        tabindex: active() === id ? 0 : -1,
        "data-link-target": target,
        onFocus: () => {
          setStored(id);
          setCursor(-1);
        },
        onClick: () => {
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          options.onActivate?.(id);
        },
        onKeyDown: (event) => keyDown(id, event),
        onPointerDown: (event) => pointerDown(event, id),
      };
    },
    edgeProps: (id) => {
      const edge = edgeList().find((candidate) => candidate.id === id);
      if (edge === undefined) {
        return {
          "data-part": "edge",
          role: "button",
          "aria-label": "",
          tabindex: -1,
          onClick: () => {},
        };
      }
      const name = `${labelOf(edge.from)} ${ARROW} ${labelOf(edge.to)}`;
      return {
        "data-part": "edge",
        role: "button",
        "aria-label": edge.label === undefined ? name : `${edge.label}: ${name}`,
        tabindex: -1,
        onClick: () => {
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          options.onEdgeActivate?.(id);
        },
      };
    },
    frameProps,
    edgesOf,
    edgeCursor,
    setEdgeCursor,
    status,
    statusProps: { "data-part": "status", role: "status", "aria-live": "polite" },
    linking,
    connectFrom,
    startConnect,
    cancelConnect,
    connectTo,
  };
};
