// A board: a DOM plane you arrange a design system on. The cards are real elements — a token card carries its painted value,
// its text value and the rule behind it, and a part card holds a live component — and the lines behind them say which part
// uses which token. Nothing is painted on a canvas: the page's own text, focus, tokens and dark mode are the board's, so the
// map is readable with the stylesheet off and a reader who never points at it still gets every relationship as text.
import { shapePath } from "@cssints/css-grammar/shape";
import { createPanZoom } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, createMemo, createSignal, For, merge, Show } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { connectorBetween, curveBetween } from "../route.ts";
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
  /**
   * The CSS property the token feeds (`color`, `border-radius`), which is what makes the card's value editable: a typed
   * value is judged by `CSS.supports(property, …)` before the plane takes it. A token without it stays text, and a part
   * card always does.
   */
  readonly property?: string | undefined;
}

/** A line from one card to another: a part uses a token, a token derives from another. */
export interface BoardEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string | undefined;
  /**
   * How the line is drawn: `arrow` is the curve of perfect-arrows with its head (the default); `shape` is a CSS
   * connector, a `border-shape` where the browser has one and the same curve as an SVG path where it has not. A shape
   * line routes around nothing, so it is for a pair that does not cross the map.
   */
  readonly line?: "arrow" | "shape" | undefined;
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
  /** The look the plane starts under; the switch in its settings bar moves it (the theme's `data-mode` look). */
  readonly defaultMode?: "light" | "dark" | undefined;
  /**
   * The content's size on the plane, in px. Left out, the content is the frame itself; a map bigger than the frame gives
   * its own size, and pan and zoom explore it (Fit is the smallest scale).
   */
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  /** The scale the plane opens at; `0.5` is the whole map in the frame, `1` the map's own size. @default 1 */
  readonly defaultScale?: number | undefined;
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

/**
 * A token's custom property: the theme names it after the token's path (`color.highlight` → `--color-highlight`), so the
 * card's title is the whole address of the value its field edits.
 */
const tokenOf = (node: BoardNode): string => `--${node.title.replaceAll(".", "-")}`;

/** A field on a card owns the pointer: typing in it and selecting text are not a drag. */
const isField = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest("input, textarea, select, [contenteditable]") !== null;

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
// point under the cursor still only about that origin. The plane is the frame; the world inside carries the content's own
// size, centred on the plane, so a map bigger than the frame is panned instead of cropped at build time.
const planeClass = css.cn(css.position("absolute"), css.inset("0"), css.transformOrigin("50% 50%"));

const worldClass = css.cn(
  css.position("absolute"),
  css.left("50%"),
  css.top("50%"),
  css.width("var(--board-width, 100%)"),
  css.height("var(--board-height, 100%)"),
  css.transform("translate(-50%, -50%)"),
);

const cardsClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
);

// The arrows are drawn over the cards, as a whiteboard's are: a connection is a fact about the map, so it is never hidden by
// a card it crosses. They are thin on purpose — a map with twenty of them is read through the lines, not around them.
const edgesClass = css.cn(
  css.position("absolute"),
  css.zIndex("3"),
  css.inset("0"),
  css.width("100%"),
  css.height("100%"),
  css.overflow("visible"),
  css.pointerEvents("none"),
);

const lineClass = css.cn(
  css.stroke(t.color.borderHover),
  css.strokeWidth("1.25"),
  css.fill("none"),
  css.strokeLinecap("round"),
);

// The lines a current card touches: the same highlight the card's border takes, so the blast radius reads as one picture.
const lineLiveClass = css.cn(
  css.stroke(t.color.highlight),
  css.fill("none"),
  css.strokeWidth("2.5"),
  css.strokeLinecap("round"),
);

const arrowHeadClass = css.cn(css.stroke("none"), css.fill(t.color.borderHover));

const arrowHeadLiveClass = css.cn(arrowHeadClass, css.fill(t.color.highlight));

const edgeAwayClass = css.cn(css.opacity("0.2"));

// A CSS connector: the curve is the element's border, so border-shape draws the line and nothing else. The fallback is
// the same shape() as an SVG path (shapePath), which keeps its width under the non-uniform scale of the plane's box.
const connectorClass = css.cn(css.position("absolute"), css.zIndex("3"), css.pointerEvents("none"));

const connectorNativeClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.borderWidth("2px"),
  css.borderStyle("solid"),
  css.borderColor(t.color.borderHover),
  css.borderShape("var(--_shape)"),
  // a browser without the property would paint the whole rectangle: drop the border instead
  css.supports("not (border-shape: shape(from 0 0, line to 1px 1px))")(css.borderWidth("0")),
);

const connectorSvgClass = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.width("100%"),
  css.height("100%"),
  css.overflow("visible"),
  css.supports("(border-shape: shape(from 0 0, line to 1px 1px))")(css.display("none")),
);

const connectorPathClass = css.cn(
  css.fill("none"),
  css.stroke(t.color.borderHover),
  css.strokeWidth("2px"),
  css.vectorEffect("non-scaling-stroke"),
);

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

// The same chip as a field: a token's value is typed where it is read, and a value the property refuses keeps the invalid
// ring instead of reaching the plane.
const fieldClass = css.cn(
  valueClass,
  css.width("100%"),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.bg(t.color.surface),
  css.fontFamily("inherit"),
  css.color("inherit"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("1px")),
  css.attr("aria-invalid", "true")(css.borderColor(t.color.invalid)),
);

const outlineClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.text));

const outlineSummaryClass = css.cn(
  css.width("max-content"),
  css.cursor("pointer"),
  css.color(t.color.muted),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const outlineListClass = css.cn(
  css.display("grid"),
  css.gap("2px"),
  css.margin("0"),
  css.marginBlockStart(t.space._1),
  css.padding("0"),
  css.listStyle("none"),
  css.maxBlockSize("10rem"),
  css.overflowY("auto"),
);

const outlineItemClass = css.cn(
  css.display("flex"),
  css.gap(t.space._2),
  css.alignItems("baseline"),
  css.width("100%"),
  css.boxSizing("border-box"),
  css.paddingBlock("2px"),
  css.paddingInline(t.space._1),
  css.border("none"),
  css.borderRadius(t.radius.sm),
  css.bg("transparent"),
  css.color("inherit"),
  css.fontFamily("inherit"),
  css.fontSize("inherit"),
  css.textAlign("start"),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

const outlineCurrentClass = css.cn(css.color(t.color.highlight), css.fontWeight("600"));

const outlineKindClass = css.cn(css.marginInlineStart("auto"), css.color(t.color.muted));

const noteClass = css.cn(css.margin("0"), css.color(t.color.muted));

const zoomClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.fontVariantNumeric("tabular-nums"),
);

const settingsClass = css.cn(
  css.display("flex"),
  css.flexWrap("wrap"),
  css.alignItems("center"),
  css.gap(t.space._2),
);

const modeClass = css.cn(css.marginInlineStart("auto"));

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
 *
 * Two things make it a management view rather than a picture. A token card whose `property` is known carries its value as a
 * field: what is typed there is checked with `CSS.supports` and set on the plane as the theme's own custom property, so the
 * swatch, the cards made of that token and the real components in the previews all move at once. The outline is the map's
 * linear reading: every card in document order, with what it reaches, and one press brings it to the middle of the frame and
 * the focus.
 */
export const Board = (props: BoardProps): JSX.Element => {
  const pan = createPanZoom({
    bounds: "free",
    // a map that is wider and taller than the box: `0` (and Fit) pulls the whole of it into view
    min: 0.5,
    max: 2,
    step: 0.25,
    get defaultScale() {
      return props.defaultScale ?? 1;
    },
    get labels() {
      return { viewport: props.label };
    },
  });

  const [positions, setPositions] = createSignal<Readonly<Record<string, Position>>>({});
  const [current, setCurrent] = createSignal<string | undefined>(props.defaultSelected);
  // the mise-en-mode look over the plane: the same tokens, the mode the theme registers for `data-mode`
  const [mode, setMode] = createSignal<"light" | "dark">(props.defaultMode ?? "light");
  // The values typed into the plane, by node id; a missing key is the theme's own. They are set on the world element as the
  // theme's custom properties, so the card's swatch, every other token made of them and every real component that reads
  // them move together: one edit, the whole system.
  const [values, setValues] = createSignal<Readonly<Record<string, string>>>({});
  // The plane's own values, read off it rather than off the data: a colour's `detail` is its role ("accent"), and the value
  // a field starts from is what the plane uses. Read once the world is placed, and again after a mode switch — the same
  // token is another colour under the dark look.
  const [planeValues, setPlaneValues] = createSignal<Readonly<Record<string, string>>>({});
  const [placed, setPlaced] = createSignal(false);

  // the plane as the drag measures it, and the pointer's gesture
  let world: HTMLElement | undefined;
  let moving: Moving | undefined;

  const byId = createMemo(() => new Map(props.nodes.map((node) => [node.id, node])));
  const edges = (): ReadonlyArray<BoardEdge> => props.edges ?? [];

  const placement = (node: BoardNode): Position => positions()[node.id] ?? { x: node.x, y: node.y };

  const boxOf = (node: BoardNode) => {
    const at = placement(node);
    return { x: at.x, y: at.y, width: node.width, height: node.height };
  };

  // a split effect: the compute phase names the dependencies, the apply phase reads the plane
  createEffect(
    () => [placed(), mode(), props.nodes] as const,
    () => {
      const element = world;
      if (!placed() || element === undefined) {
        return;
      }
      const style = getComputedStyle(element);
      setPlaneValues(
        Object.fromEntries(
          props.nodes.flatMap((node) =>
            node.property === undefined
              ? []
              : [[node.id, style.getPropertyValue(tokenOf(node)).trim()] as const],
          ),
        ),
      );
    },
  );

  /** What a token card's field shows: what was typed over the theme's value, else the plane's own value. */
  const shown = (node: BoardNode): string =>
    values()[node.id] ?? planeValues()[node.id] ?? node.detail ?? "";

  /**
   * What `detail` still means once the value is a field: a step's detail *is* its value (`6px`), so the field shows it; a
   * colour's value is its swatch, and its detail is what the colour is for ("accent", "hints"), which stays text.
   */
  const roleOf = (node: BoardNode): string | undefined =>
    node.property === undefined ? node.detail : node.swatch === undefined ? undefined : node.detail;

  /** An empty field is the theme's own value, so it drops the override rather than setting an empty one. */
  const setValue = (node: BoardNode, next: string | undefined): void => {
    setValues((all) => {
      const copy = { ...all };
      if (next === undefined) {
        delete copy[node.id];
      } else {
        copy[node.id] = next;
      }
      return copy;
    });
  };

  /** Enter or a blur takes a typed value where `CSS.supports` does; anything else keeps the plane as it was. */
  const commit = (node: BoardNode, input: HTMLInputElement): void => {
    const text = input.value.trim();
    if (text !== "" && !CSS.supports(node.property ?? "", text)) {
      input.setAttribute("aria-invalid", "true");
      return;
    }
    input.removeAttribute("aria-invalid");
    setValue(node, text === "" ? undefined : text);
  };

  /** Escape abandons what was typed: the field and the plane go back to the value they had. */
  const revert = (node: BoardNode, input: HTMLInputElement): void => {
    input.value = shown(node);
    input.removeAttribute("aria-invalid");
  };

  /** The typed values as the theme's custom properties, applied to the world so every card and preview follows them. */
  const overrides = (): Record<string, string> => {
    const typed = values();
    return Object.fromEntries(
      props.nodes.flatMap((node) => {
        const value = typed[node.id];
        return node.property !== undefined && value !== undefined
          ? [[tokenOf(node), value] as const]
          : [];
      }),
    );
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
        x: bound(next.x, (world?.clientWidth ?? 0) - node.width),
        y: bound(next.y, (world?.clientHeight ?? 0) - node.height),
      },
    }));
  };

  const startDrag = (event: PointerEvent, node: BoardNode): void => {
    if (event.button !== 0) {
      return;
    }
    // a token's field keeps the pointer, and the current card with it: selecting text is not a drag
    if (isField(event.target)) {
      event.stopPropagation();
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

  /**
   * The outline's one action: make a card current, put it in the middle of the frame and give it the focus. The world is
   * centred on the plane and the plane's transform origin is its own centre, so the pan that centres a card is the card's
   * distance from the world's centre, scaled, less the pan it already has.
   */
  const goTo = (node: BoardNode): void => {
    setCurrent(node.id);
    const element = world;
    if (element !== undefined) {
      const at = placement(node);
      const scale = pan.scale();
      const behind = pan.offset();
      pan.panBy(
        -(at.x + node.width / 2 - element.clientWidth / 2) * scale - behind.x,
        -(at.y + node.height / 2 - element.clientHeight / 2) * scale - behind.y,
      );
    }
    // the plane is transformed, not scrolled: focusing without a scroll keeps the centring above exact
    element
      ?.querySelector<HTMLElement>(`[data-node="${CSS.escape(node.id)}"] [data-part="board-head"]`)
      ?.focus({ preventScroll: true });
  };

  const routed = createMemo(() =>
    edges().flatMap((edge) => {
      if (edge.line === "shape") {
        return [];
      }
      const from = byId().get(edge.from);
      const to = byId().get(edge.to);
      if (from === undefined || to === undefined) {
        return [];
      }
      const curve = curveBetween(boxOf(from), boxOf(to));
      return curve === undefined ? [] : [{ edge, curve }];
    }),
  );

  /** The shape edges: one shape() string drives both the border-shape and the path, so they cannot drift apart. */
  const connectors = createMemo(() =>
    edges().flatMap((edge) => {
      if (edge.line !== "shape") {
        return [];
      }
      const from = byId().get(edge.from);
      const to = byId().get(edge.to);
      if (from === undefined || to === undefined) {
        return [];
      }
      const connector = connectorBetween(boxOf(from), boxOf(to));
      if (connector === undefined) {
        return [];
      }
      return [{ edge, ...connector, path: shapePath(connector.shape).d }];
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
    get "data-mode"() {
      return mode();
    },
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
    <figure
      data-part="board-frame"
      class={rootClass}
      style={
        {
          "--board-width": props.width === undefined ? "100%" : `${props.width}px`,
          "--board-height": props.height === undefined ? "100%" : `${props.height}px`,
        } as never
      }
    >
      <figcaption data-part="board-caption" class={captionClass}>
        <span class={captionNameClass}>{props.label}</span>
        <span class={hintClass}>
          Drag a card to place it, drag the plane to pan, and pick a card to see what it reaches. A
          token's value is a field: type another and the whole map follows. Keys: + and − zoom, 0
          fits the map, and arrows move the current card.
        </span>
      </figcaption>
      <div data-part="board-settings" class={settingsClass}>
        <Button size="sm" tone="quiet" onClick={pan.reset}>
          Fit
        </Button>
        <span {...pan.valueProps} data-part="board-zoom" class={zoomClass}>
          {pan.value()}
        </span>
        <span data-part="board-mode" class={modeClass}>
          <Button
            size="sm"
            tone="quiet"
            aria-pressed={mode() === "dark" ? "true" : "false"}
            onClick={() => setMode((look) => (look === "dark" ? "light" : "dark"))}
          >
            Dark mode
          </Button>
        </span>
      </div>
      <div {...viewport}>
        <div {...planeProps}>
          <div
            data-part="board-world"
            class={worldClass}
            style={overrides()}
            ref={(element) => {
              world = element;
              setPlaced(true);
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
                    <path class={live(item.edge) ? lineLiveClass : lineClass} d={item.curve.path} />
                    <polygon
                      class={live(item.edge) ? arrowHeadLiveClass : arrowHeadClass}
                      points={item.curve.head}
                    />
                  </g>
                )}
              </For>
            </svg>
            <For each={connectors()}>
              {(item) => (
                <div
                  data-part="board-connector"
                  data-from={item.edge.from}
                  data-to={item.edge.to}
                  class={css.cn(
                    connectorClass,
                    current() !== undefined && !live(item.edge) && edgeAwayClass,
                  )}
                  style={
                    {
                      left: `${item.left}px`,
                      top: `${item.top}px`,
                      width: `${item.width}px`,
                      height: `${item.height}px`,
                      "--_shape": item.shape,
                    } as never
                  }
                >
                  <div data-part="board-connector-native" class={connectorNativeClass} />
                  <svg
                    data-part="board-connector-fallback"
                    class={connectorSvgClass}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path class={connectorPathClass} d={item.path} />
                  </svg>
                </div>
              )}
            </For>
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
                          <Show when={node.property !== undefined}>
                            <input
                              data-part="board-value"
                              class={fieldClass}
                              type="text"
                              autocomplete="off"
                              spellcheck={false}
                              aria-label={`${node.title} value`}
                              value={shown(node)}
                              onKeyDown={(event) => {
                                // a text field owns its keys: the plane neither pans nor drops the card while typing
                                event.stopPropagation();
                                if (event.key === "Enter") {
                                  commit(node, event.currentTarget);
                                } else if (event.key === "Escape") {
                                  revert(node, event.currentTarget);
                                }
                              }}
                              onBlur={(event) => commit(node, event.currentTarget)}
                            />
                          </Show>
                          <Show when={roleOf(node) !== undefined}>
                            <code data-part="board-value" class={valueClass}>
                              {roleOf(node)}
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
      </div>
      <details data-part="board-outline" class={outlineClass}>
        <summary class={outlineSummaryClass}>Outline ({props.nodes.length} cards)</summary>
        <ol class={outlineListClass}>
          <For each={props.nodes}>
            {(node) => (
              <li>
                <button
                  type="button"
                  data-part="board-outline-item"
                  data-outline={node.id}
                  class={css.cn(outlineItemClass, current() === node.id && outlineCurrentClass)}
                  aria-current={current() === node.id ? "true" : undefined}
                  onClick={() => goTo(node)}
                >
                  <span>{node.title}</span>
                  <span class={outlineKindClass}>
                    {node.kind} · {reads(node.id)}
                  </span>
                </button>
              </li>
            )}
          </For>
        </ol>
      </details>
      <p data-part="board-status" class={statusClass} role="status">
        {summary()}
      </p>
    </figure>
  );
};
