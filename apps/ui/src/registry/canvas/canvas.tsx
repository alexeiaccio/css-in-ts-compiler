// A canvas of cards on `createCanvas`: the pointer gestures, the arrow keys, the marquee, the snapping and the live region are
// the primitive's. The skin adds the two things a canvas needs once it is bigger than its frame — a minimap that is also a
// camera, and a drag that pans when it reaches the edge — both of which are policies over `panBy` and `screenToWorld`, so
// neither of them is a member of the primitive.
import {
  type CanvasNodeInput,
  createCanvas,
  type Canvas as CanvasController,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createMemo, For, Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export type { CanvasNodeInput };

export interface CanvasProps {
  /** The cards, in world units: whole px, the origin at the top left of the world. */
  readonly nodes: ReadonlyArray<CanvasNodeInput>;
  /** The canvas's accessible name. */
  readonly label: string;
  /** The frame's size, screen px (default 720 x 460). */
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  /** Off leaves the drag alone at the edge; on (default) a drag near the edge pans. */
  readonly autoPan?: boolean | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 460;
/** How far from the frame's edge a drag starts panning, and how many pixels a move pans there. */
const AUTO_PAN_MARGIN = 48;
const AUTO_PAN_STEP = 12;
/** One wheel notch, as the primitive's fixed point (4096 = x1). */
const ZOOM_STEP = 1.15 * 4096;
const MINIMAP_WIDTH = 168;
const MINIMAP_HEIGHT = 112;
/** Room around the extents on the minimap, in world units. */
const MINIMAP_PAD = 80;

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2), css.width("100%"));

// The frame clips the world; the primitive's own style carries `overflow: clip` and `touch-action: none`, which is why the
// host's style is merged in rather than replaced.
const viewportClass = css.cn(
  css.position("relative"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.overflow("clip"),
  css.touchAction("none"),
  css.bg(t.color.page),
  // a dot grid that does not move with the camera: the camera's own transform is the only motion
  css.backgroundImage("radial-gradient(circle, rgb(0 0 0 / 0.14) 1px, transparent 1px)"),
  css.backgroundSize("24px 24px"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const cardClass = css.cn(
  css.position("absolute"),
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.padding(t.space._2),
  css.boxSizing("border-box"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.textAlign("center"),
  css.cursor("grab"),
  css.boxShadow("0 1px 2px rgb(0 0 0 / 0.12)"),
  css.attr("aria-selected", "true")(
    css.borderColor(t.color.highlight),
    css.boxShadow("inset 0 0 0 2px", t.color.highlight),
  ),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const minimapClass = css.cn(
  css.position("absolute"),
  css.right(t.space._2),
  css.bottom(t.space._2),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.sm),
  css.boxShadow("0 1px 3px rgb(0 0 0 / 0.16)"),
  css.cursor("pointer"),
  css.opacity("0.94"),
  css.hover(css.opacity("1")),
);

const minimapNodeClass = css.cn(css.fill(t.color.border), css.stroke("none"));

const minimapViewClass = css.cn(
  css.fill("transparent"),
  css.stroke(t.color.highlight),
  css.strokeWidth("1.5"),
);

const statusClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));

/** How far into an edge margin a coordinate is: -1 at the near edge, 1 at the far one, 0 in the middle. */
const depth = (at: number, size: number): number => {
  if (at < AUTO_PAN_MARGIN) {
    return -Math.min(1, (AUTO_PAN_MARGIN - at) / AUTO_PAN_MARGIN);
  }
  if (at > size - AUTO_PAN_MARGIN) {
    return Math.min(1, (at - (size - AUTO_PAN_MARGIN)) / AUTO_PAN_MARGIN);
  }
  return 0;
};

/**
 * The minimap: every card as a box, the frame's own view as a rectangle, and a click anywhere on it centres the camera
 * there. Its scale is the union of the cards and the current view, so the rectangle is always on the map; it is
 * `aria-hidden`, because it is a second way to the same camera the viewport already offers from the keyboard.
 */
const Minimap = (props: {
  readonly canvas: CanvasController;
  readonly nodes: ReadonlyArray<CanvasNodeInput>;
}): JSX.Element => {
  // the camera, read through the primitive: a pan or a zoom re-derives both boxes
  const view = createMemo(() => {
    const { viewport } = props.canvas.state();
    const topLeft = props.canvas.screenToWorld({ x: 0, y: 0 });
    const bottomRight = props.canvas.screenToWorld({ x: viewport.width, y: viewport.height });
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  });
  const world = createMemo(() => {
    const cards = props.nodes.reduce(
      (box, node) => ({
        left: Math.min(box.left, node.x),
        top: Math.min(box.top, node.y),
        right: Math.max(box.right, node.x + node.width),
        bottom: Math.max(box.bottom, node.y + node.height),
      }),
      { left: 0, top: 0, right: 0, bottom: 0 },
    );
    const here = view();
    const left = Math.min(cards.left, here.x) - MINIMAP_PAD;
    const top = Math.min(cards.top, here.y) - MINIMAP_PAD;
    const right = Math.max(cards.right, here.x + here.width) + MINIMAP_PAD;
    const bottom = Math.max(cards.bottom, here.y + here.height) + MINIMAP_PAD;
    return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
  });
  const scale = createMemo(() =>
    Math.min(MINIMAP_WIDTH / world().width, MINIMAP_HEIGHT / world().height),
  );
  const at = (x: number, y: number): { readonly x: number; readonly y: number } => ({
    x: (x - world().left) * scale(),
    y: (y - world().top) * scale(),
  });
  const jump = (event: PointerEvent): void => {
    // the map is inside the frame: a click on it must not also start a pan or a marquee underneath
    event.stopPropagation();
    const box = (event.currentTarget as Element).getBoundingClientRect();
    const point = at(0, 0);
    const x = world().left + (event.clientX - box.left - point.x) / scale();
    const y = world().top + (event.clientY - box.top - point.y) / scale();
    props.canvas.animateTo({ kind: "centre", x, y });
  };
  return (
    <svg
      data-part="canvas-minimap"
      aria-hidden="true"
      class={minimapClass}
      width={MINIMAP_WIDTH}
      height={MINIMAP_HEIGHT}
      viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
      onPointerDown={jump}
    >
      <For each={props.nodes}>
        {(node) => (
          <rect
            data-part="canvas-minimap-node"
            data-node={node.id}
            class={minimapNodeClass}
            x={at(node.x, node.y).x}
            y={at(node.x, node.y).y}
            width={Math.max(2, node.width * scale())}
            height={Math.max(2, node.height * scale())}
            rx="1"
          />
        )}
      </For>
      <rect
        data-part="canvas-minimap-view"
        class={minimapViewClass}
        x={at(view().x, view().y).x}
        y={at(view().x, view().y).y}
        width={Math.max(2, view().width * scale())}
        height={Math.max(2, view().height * scale())}
      />
    </svg>
  );
};

/**
 * A canvas of cards: drag one to move it (the pointer's own snap), marquee the empty space, Tab in and out, the arrows move
 * the selected card, `+` / `-` zoom. The minimap in the corner is the second camera and a click on it recentres; a drag that
 * reaches the frame's edge pulls the camera with it, so a card can be carried past what is on screen.
 */
export const Canvas = (props: CanvasProps): JSX.Element => {
  let frame: HTMLElement | undefined;
  const canvas = createCanvas({
    nodes: props.nodes,
    label: props.label,
    viewport: {
      width: props.width ?? DEFAULT_WIDTH,
      height: props.height ?? DEFAULT_HEIGHT,
    },
  });

  // Auto-pan is a policy, not a member: the primitive already draws a drag from the pointer's world position, so panning
  // the camera under a pointer at the edge is the whole of it. It runs on the pointer's own moves — a pointer held still at
  // the edge does not keep pulling (ponytail: a frame loop if a user ever asks for that).
  const autoPan = (event: PointerEvent): void => {
    if (props.autoPan === false || frame === undefined) {
      return;
    }
    if (canvas.state().mode !== "dragging") {
      return;
    }
    const box = frame.getBoundingClientRect();
    const dx = depth(event.clientX - box.left, box.width) * AUTO_PAN_STEP;
    const dy = depth(event.clientY - box.top, box.height) * AUTO_PAN_STEP;
    if (dx !== 0 || dy !== 0) {
      canvas.panBy(dx, dy);
    }
  };

  const wheel = (event: WheelEvent): void => {
    const box = frame?.getBoundingClientRect();
    if (box === undefined) {
      return;
    }
    event.preventDefault();
    canvas.zoomBy(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, [
      event.clientX - box.left,
      event.clientY - box.top,
    ]);
  };

  return (
    <div data-part="canvas" class={css.cn(rootClass, props.class)}>
      <div
        {...canvas.viewportProps}
        ref={(element) => {
          frame = element;
          canvas.viewportProps.ref(element);
        }}
        onPointerMove={(event) => {
          canvas.viewportProps.onPointerMove(event);
          autoPan(event);
        }}
        onWheel={wheel}
        data-part="canvas-frame"
        class={viewportClass}
        style={{
          ...canvas.viewportProps.style,
          width: `${props.width ?? DEFAULT_WIDTH}px`,
          height: `${props.height ?? DEFAULT_HEIGHT}px`,
        }}
      >
        <div {...canvas.layerProps} data-part="canvas-layer">
          <For each={canvas.nodeIds()}>
            {(id) => {
              const node = props.nodes.find((candidate) => candidate.id === id);
              return (
                <div
                  {...canvas.nodeProps(id)}
                  data-part="canvas-card"
                  data-node={id}
                  class={cardClass}
                  style={canvas.nodeProps(id).style}
                >
                  {/* the shell is the tab stop and always rendered; the body drops when the primitive culls it */}
                  <Show when={!canvas.isCulled(id)}>{node?.label}</Show>
                </div>
              );
            }}
          </For>
        </div>
        <Minimap canvas={canvas} nodes={props.nodes} />
      </div>
      <p {...canvas.liveRegionProps} data-part="canvas-status" class={statusClass} />
    </div>
  );
};
