// A board: a DOM plane you arrange a design system on. The cards are real elements — a token card carries its painted value,
// its text value and the rule behind it, and a part card holds a live component — and the lines behind them say which part
// uses which token. Nothing is painted on a canvas: the page's own text, focus, tokens and dark mode are the board's, so the
// map is readable with the stylesheet off and a reader who never points at it still gets every relationship as text.
import { createPanZoom } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createMemo, createSignal, For, merge, Show } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { routeBetween } from "../route.ts";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the card list, `data-part` and the caller's class merged in. */
export type BoardPartProps = PartProps;

/** A card on the plane. A token is data; a part is a component the page gives a preview of. */
export interface BoardNode {
  readonly id: string;
  /** The card's corner on the plane, in plane pixels. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** `token` paints a swatch and a value; `part` holds a live component in its body. */
  readonly kind: "token" | "part";
  /** The card's name: a token's CSS name (`color.highlight`) or a component's (`Button`). */
  readonly title: string;
  /** The token's value as text (`6px`), or a part's short role; a colour's value is the swatch. */
  readonly detail?: string | undefined;
  /** The rule behind a token: why it exists, in the design system's own words. */
  readonly note?: string | undefined;
  /** A token's painted value, e.g. `var(--color-highlight)`. */
  readonly swatch?: string | undefined;
}

/** A line from one card to another: a part uses a token, a token derives from another. */
export interface BoardEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string | undefined;
}

export interface BoardProps extends Renderable<BoardPartProps, void> {
  /** The board's name, which is the figure's caption and the plane's accessible name. */
  readonly label: string;
  /** The cards, in the order a reader meets them. */
  readonly nodes: ReadonlyArray<BoardNode>;
  /** The lines, and the relationships the cards state in words. */
  readonly edges?: ReadonlyArray<BoardEdge> | undefined;
  /** The card that starts current, so a page can open the board on a token; Escape drops it. */
  readonly defaultSelected?: string | undefined;
  /** A part card's body: the page's own component, inert to the pointer because a card is not a control. */
  readonly preview?: ((node: BoardNode) => JSX.Element | undefined) | undefined;
  readonly class?: string | undefined;
}

/** Arrow-key nudge, in plane px; Shift multiplies it. */
const NUDGE = 8;
const NUDGE_SHIFT = 24;

interface Position {
  readonly x: number;
  readonly y: number;
}

interface Moving {
  readonly id: string;
  readonly pointerId: number;
  /** Where the pointer started, and where the card was then. */
  readonly at: Position;
  readonly from: Position;
}

const rootClass = css.cn(
  css.display("grid"),
  css.gap(t.space._2),
  css.width("100%"),
  css.margin("0"),
);

const captionClass = css.cn(
  css.display("grid"),
  css.gap("2px"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
);

const captionNameClass = css.cn(css.fontWeight("600"), css.fontSize(t.font.size));

const hintClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));

// The plane: the primitive's box, with the rounded corners and the focus ring. `touch-action: none` is the touch pan, and the
// grab cursor says the empty plane is draggable — a card says the same for itself.
const viewportClass = css.cn(
  css.position("relative"),
  css.height("26rem"),
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.bg(t.color.page),
  // a faint dot grid says "plane" rather than "card"; it is the page's border colour, so it follows the mode
  css.backgroundImage("radial-gradient(var(--color-border) 1px, transparent 1px)"),
  css.backgroundSize("16px 16px"),
  css.touchAction("none"),
  css.cursor("grab"),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

// The transform is the primitive's, inline. The origin is the centre, which is the maths `setScale` assumes: a zoom keeps the
// point under the cursor still only about that origin.
const planeClass = css.cn(css.position("absolute"), css.inset("0"), css.transformOrigin("50% 50%"));

const cardsClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
);

// The lines sit between the cards: under every card at rest, above a card the current one dimmed, so the blast radius reads
// as one stroke instead of disappearing behind the cards it crosses.
const edgesClass = css.cn(
  css.position("absolute"),
  css.zIndex("1"),
  css.inset("0"),
  css.width("100%"),
  css.height("100%"),
  css.overflow("visible"),
  css.pointerEvents("none"),
);

const lineClass = css.cn(
  css.stroke(t.color.borderHover),
  css.strokeWidth("1.5"),
  css.fill(t.color.borderHover),
);

// The lines a current card touches: the same highlight the card's border takes, so the blast radius reads as one picture.
const lineLiveClass = css.cn(
  css.stroke(t.color.highlight),
  css.fill(t.color.highlight),
  css.strokeWidth("2.5"),
);

const edgeAwayClass = css.cn(css.opacity("0.2"));

const cardClass = css.cn(
  css.position("absolute"),
  css.zIndex("2"),
  css.display("grid"),
  css.gridTemplateRows("auto 1fr"),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.boxShadow("0 1px 2px rgb(0 0 0 / 0.08)"),
  css.cursor("grab"),
  css.touchAction("none"),
  css.transition("border-color 120ms, opacity 120ms"),
);

const currentCardClass = css.cn(
  css.borderColor(t.color.highlight),
  css.boxShadow("inset 0 0 0 1px", t.color.highlight),
);

const awayClass = css.cn(css.opacity("0.45"), css.zIndex("0"));

const headClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.width("100%"),
  css.boxSizing("border-box"),
  css.padding(t.space._2),
  css.border("none"),
  css.borderRadius(t.radius.md),
  css.bg("transparent"),
  css.color("inherit"),
  css.fontFamily("inherit"),
  css.textAlign("start"),
  css.cursor("grab"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

const swatchClass = css.cn(
  css.width("1.5rem"),
  css.height("1.5rem"),
  css.flex("none"),
  css.borderRadius(t.radius.sm),
  css.border("1px solid", t.color.border),
);

const titleClass = css.cn(
  css.fontSize(t.font.size),
  css.fontWeight("600"),
  css.overflowWrap("anywhere"),
  css.minWidth("0"),
);

const bodyClass = css.cn(
  css.display("grid"),
  css.gap(t.space._1),
  css.alignContent("start"),
  css.padding(t.space._2),
  css.paddingBlock("0"),
  css.borderTop("1px solid", t.color.border),
  css.fontSize(t.font.sizeSm),
  css.overflowWrap("anywhere"),
);

const previewClass = css.cn(css.display("grid"), css.placeItems("center"), css.padding(t.space._2));

const valueClass = css.cn(
  css.width("max-content"),
  css.paddingInline(t.space._1),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.buttonBackground),
  css.fontFamily("monospace"),
  css.fontSize(t.font.sizeSm),
);

const noteClass = css.cn(css.margin("0"), css.color(t.color.muted));

const barClass = css.cn(
  css.display("flex"),
  css.flexWrap("wrap"),
  css.alignItems("baseline"),
  css.justifyContent("space-between"),
  css.gap(t.space._2),
);

const zoomClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.fontVariantNumeric("tabular-nums"),
);

const statusClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.text));

/**
 * A board: a plane of cards you arrange, styled and driven by the primitive's own gestures.
 *
 * `createPanZoom` owns the plane — the drag, the pinch, `Ctrl`/`⌘` + wheel, `+` / `-` / `0`, the arrows when the plane has
 * the focus, and the live value — with `bounds: "free"`, because a board is not one image fitted to its box. The skin owns
 * the cards: a token's swatch, value and rule, a part's live preview, the pointer drag of a card, the arrow nudge when a card
 * has the focus, and the current card that dims everything it does not touch.
 *
 * The data is the cards' text. A token card states the parts that use it, a part card states the tokens it uses, and the SVG
 * lines are decoration (`aria-hidden`): with the stylesheet off the board is a list of names, values, rules and relationships.
 */
export const Board = (props: BoardProps): JSX.Element => {
  const pan = createPanZoom({
    bounds: "free",
    min: 1,
    max: 2,
    step: 0.25,
    defaultScale: 1,
    get labels() {
      return { viewport: props.label };
    },
  });

  const [positions, setPositions] = createSignal<Readonly<Record<string, Position>>>({});
  const [current, setCurrent] = createSignal<string | undefined>(props.defaultSelected);

  // the plane as the drag measures it, and the pointer's gesture
  let plane: HTMLElement | undefined;
  let moving: Moving | undefined;

  const byId = createMemo(() => new Map(props.nodes.map((node) => [node.id, node])));
  const edges = (): ReadonlyArray<BoardEdge> => props.edges ?? [];

  const placement = (node: BoardNode): Position => positions()[node.id] ?? { x: node.x, y: node.y };

  const boxOf = (node: BoardNode) => {
    const at = placement(node);
    return { x: at.x, y: at.y, width: node.width, height: node.height };
  };

  const uses = (id: string): string[] =>
    edges().flatMap((edge) => {
      if (edge.from !== id) {
        return [];
      }
      const to = byId().get(edge.to);
      return to === undefined ? [] : [to.title];
    });

  const usedBy = (id: string): string[] =>
    edges().flatMap((edge) => {
      if (edge.to !== id) {
        return [];
      }
      const from = byId().get(edge.from);
      return from === undefined ? [] : [from.title];
    });

  /** The card is the current one, or one of its neighbours; with nothing current every card is in. */
  const related = (id: string): boolean => {
    const chosen = current();
    if (chosen === undefined || chosen === id) {
      return true;
    }
    return edges().some(
      (edge) =>
        (edge.from === chosen && edge.to === id) || (edge.to === chosen && edge.from === id),
    );
  };

  /** What the card knows about its own connections, in words: never a value that only a line carries. */
  const reads = (id: string): string => {
    const node = byId().get(id);
    if (node === undefined) {
      return "";
    }
    if (node.kind === "token") {
      const parts = usedBy(id);
      return parts.length === 0 ? "Used by nothing yet" : `Used by ${parts.join(", ")}`;
    }
    const tokens = uses(id);
    return tokens.length === 0 ? "Uses no tokens yet" : `Uses ${tokens.join(", ")}`;
  };

  const summary = (): string => {
    const chosen = current();
    if (chosen === undefined) {
      return "";
    }
    const node = byId().get(chosen);
    return node === undefined ? "" : `${node.title}, current. ${reads(chosen)}.`;
  };

  /** Keep a card on the plane: a card dragged past an edge stays reachable. */
  const bound = (value: number, limit: number): number =>
    Math.min(Math.max(0, limit), Math.max(0, value));

  const moveTo = (node: BoardNode, next: Position): void => {
    setPositions((all) => ({
      ...all,
      [node.id]: {
        x: bound(next.x, (plane?.clientWidth ?? 0) - node.width),
        y: bound(next.y, (plane?.clientHeight ?? 0) - node.height),
      },
    }));
  };

  const startDrag = (event: PointerEvent, node: BoardNode): void => {
    if (event.button !== 0) {
      return;
    }
    // the card takes the pointer, so the plane does not pan under it
    event.stopPropagation();
    setCurrent(node.id);
    const element = event.currentTarget;
    if (element instanceof Element) {
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // a synthetic pointer (a test, assistive technology) is not active: there is nothing to capture
      }
    }
    moving = {
      id: node.id,
      pointerId: event.pointerId,
      at: { x: event.clientX, y: event.clientY },
      from: placement(node),
    };
  };

  const drag = (event: PointerEvent): void => {
    const entry = moving;
    if (entry === undefined || entry.pointerId !== event.pointerId) {
      return;
    }
    const node = byId().get(entry.id);
    if (node === undefined) {
      return;
    }
    // the plane is scaled: a screen pixel is one `scale()`th of a plane pixel
    const scale = pan.scale();
    moveTo(node, {
      x: entry.from.x + (event.clientX - entry.at.x) / scale,
      y: entry.from.y + (event.clientY - entry.at.y) / scale,
    });
  };

  const drop = (event: PointerEvent): void => {
    if (moving !== undefined && moving.pointerId === event.pointerId) {
      moving = undefined;
    }
  };

  const nudge = (event: KeyboardEvent, node: BoardNode): void => {
    const step = event.shiftKey ? NUDGE_SHIFT : NUDGE;
    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    if (dx === 0 && dy === 0) {
      return;
    }
    event.preventDefault();
    // the plane pans on these keys; a card has the focus, so it is the card that moves
    event.stopPropagation();
    const at = placement(node);
    moveTo(node, { x: at.x + dx, y: at.y + dy });
  };

  const planeKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      setCurrent(undefined);
      return;
    }
    pan.viewportProps.onKeyDown(event);
  };

  const routed = createMemo(() =>
    edges().flatMap((edge) => {
      const from = byId().get(edge.from);
      const to = byId().get(edge.to);
      if (from === undefined || to === undefined) {
        return [];
      }
      const route = routeBetween(boxOf(from), boxOf(to));
      return route === undefined ? [] : [{ edge, route }];
    }),
  );

  /** The edge touches the current card: the one relationship the selection lights up. */
  const live = (edge: BoardEdge): boolean => {
    const chosen = current();
    return chosen !== undefined && (edge.from === chosen || edge.to === chosen);
  };

  const viewport = merge(pan.viewportProps, {
    "data-part": "board-viewport",
    "aria-roledescription": "board",
    get class() {
      return viewportClass;
    },
    onKeyDown: planeKeyDown,
    onPointerDown: (event: PointerEvent) => {
      // a pointer on the empty plane drops the current card; a card stops its own before this runs
      setCurrent(undefined);
      pan.viewportProps.onPointerDown(event);
    },
  } as PartProps);

  const planeProps = merge(pan.imageProps, {
    "data-part": "board-plane",
    get class() {
      return planeClass;
    },
  } as PartProps);

  const own = {
    "data-part": "board",
    get class() {
      return css.cn(cardsClass, props.class);
    },
  } as unknown as PartProps;

  return (
    <figure data-part="board-frame" class={rootClass}>
      <figcaption data-part="board-caption" class={captionClass}>
        <span class={captionNameClass}>{props.label}</span>
        <span class={hintClass}>
          Drag a card to place it, drag the plane to pan. Keys: + and − zoom, 0 resets, and arrows
          move the current card.
        </span>
      </figcaption>
      <div {...viewport}>
        <div
          {...planeProps}
          ref={(element) => {
            plane = element;
          }}
        >
          <svg data-part="board-edges" class={edgesClass} aria-hidden="true">
            <For each={routed()}>
              {(item) => (
                <g
                  data-part="board-edge"
                  data-from={item.edge.from}
                  data-to={item.edge.to}
                  class={current() !== undefined && !live(item.edge) ? edgeAwayClass : undefined}
                >
                  <line
                    class={live(item.edge) ? lineLiveClass : lineClass}
                    x1={item.route.from.x}
                    y1={item.route.from.y}
                    x2={item.route.to.x}
                    y2={item.route.to.y}
                  />
                  <polygon
                    class={live(item.edge) ? lineLiveClass : lineClass}
                    points={item.route.arrow}
                  />
                </g>
              )}
            </For>
          </svg>
          {renderPart(props, own, undefined, (part) => (
            <ul {...part}>
              <For each={props.nodes}>
                {(node) => {
                  const at = (): Position => placement(node);
                  return (
                    <li
                      data-part="board-card"
                      data-node={node.id}
                      data-kind={node.kind}
                      data-dim={current() !== undefined && !related(node.id) ? "true" : undefined}
                      class={css.cn(
                        cardClass,
                        current() === node.id && currentCardClass,
                        current() !== undefined && !related(node.id) && awayClass,
                      )}
                      style={{
                        left: `${at().x}px`,
                        top: `${at().y}px`,
                        width: `${node.width}px`,
                        height: `${node.height}px`,
                      }}
                      onPointerDown={(event) => startDrag(event, node)}
                      onPointerMove={drag}
                      onPointerUp={drop}
                      onPointerCancel={drop}
                    >
                      <button
                        type="button"
                        data-part="board-head"
                        class={headClass}
                        aria-current={current() === node.id ? "true" : undefined}
                        onClick={() => setCurrent(node.id)}
                        onKeyDown={(event) => nudge(event, node)}
                      >
                        <Show when={node.swatch}>
                          {(paint) => (
                            <span
                              data-part="board-swatch"
                              class={swatchClass}
                              style={{ background: paint() }}
                              aria-hidden="true"
                            />
                          )}
                        </Show>
                        <span class={titleClass}>{node.title}</span>
                      </button>
                      <div data-part="board-body" class={bodyClass}>
                        <Show when={node.kind === "part"}>
                          <div data-part="board-preview" class={previewClass} inert={true}>
                            {props.preview?.(node)}
                          </div>
                        </Show>
                        <Show when={node.detail !== undefined}>
                          <code data-part="board-value" class={valueClass}>
                            {node.detail}
                          </code>
                        </Show>
                        <Show when={node.note !== undefined}>
                          <p data-part="board-note" class={noteClass}>
                            {node.note}
                          </p>
                        </Show>
                        <p data-part="board-links" class={noteClass}>
                          {reads(node.id)}
                        </p>
                      </div>
                    </li>
                  );
                }}
              </For>
            </ul>
          ))}
        </div>
      </div>
      <div data-part="board-bar" class={barClass}>
        <p data-part="board-status" class={statusClass} role="status">
          {summary()}
        </p>
        <span {...pan.valueProps} data-part="board-zoom" class={zoomClass}>
          {pan.value()}
        </span>
      </div>
    </figure>
  );
};
