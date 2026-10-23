import { type Canvas, type CanvasOptions, createCanvas } from "../src";
import { For, Show, createEffect } from "solid-js";
import { NODES, POINTER_VIEWPORT } from "@cssints/apg-specs/canvas/canvas.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

export interface CanvasFixtureConfig {
  /** `pointer` mounts the spec's three fixed nodes in a 1024 x 768 viewport; `camera` mounts none in 800 x 600. */
  readonly kind: "camera" | "pointer";
  readonly reducedMotion?: boolean;
  readonly marquee?: "contain" | "overlap";
  readonly snap?: boolean;
  /** Let `requestAnimationFrame` drive tweens. Off by default: the walk ticks by hand, like the spec. */
  readonly autoFrames?: boolean;
  /** Replace the spec's nodes (DOM-only tests). */
  readonly nodes?: CanvasOptions["nodes"];
  /**
   * Render a host editor (`<textarea tabindex="-1">`, `user-select: text`) inside a node while the
   * primitive says it is being edited, and focus it. This is the host's half of the editing
   * contract; the primitive owns the IME guard, the focus-out and the layer's `user-select: none`.
   */
  readonly editor?: boolean;
}

export interface CanvasMounted extends Mounted {
  readonly canvas: Canvas;
}

const noFrames = (): void => {};

/**
 * Renders `createCanvas` as viewport > layer > nodes plus a live region, every part marked with
 * `data-part` (`viewport`, `layer`, `node<id>`, `live`), and exposes the `Mounted` the driver needs.
 * The nodes are rendered in `canvas.nodeIds()` order, which is the DOM order under test. Each
 * node's body (its children) is culled with `Show when={!canvas.isCulled(id)}` while the shell
 * stays, which is the whole point of the contract: culling never costs a tab stop.
 */
export const mountCanvas = (config: CanvasFixtureConfig): CanvasMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const nodes = config.nodes ?? (config.kind === "pointer" ? NODES : []);
  const viewport = config.kind === "pointer" ? POINTER_VIEWPORT : { width: 800, height: 600 };
  let api: Canvas | undefined;

  const dispose = render(() => {
    const canvas = createCanvas({
      nodes,
      viewport,
      ...(config.reducedMotion === undefined ? {} : { reducedMotion: config.reducedMotion }),
      ...(config.marquee === undefined ? {} : { marquee: config.marquee }),
      ...(config.snap === undefined ? {} : { snap: config.snap }),
      ...(config.autoFrames === true ? {} : { requestFrame: noFrames }),
      onSelectionChange: (ids) => push("onSelectionChange", [...ids]),
      onNodesMove: (moves) =>
        push(
          "onNodesMove",
          moves.map((move) => ({ ...move })),
        ),
    });
    api = canvas;
    const labelOf = (id: string): string => nodes.find((node) => node.id === id)?.label ?? id;
    return (
      <>
        <div
          data-part="viewport"
          {...canvas.viewportProps}
          style={{
            ...canvas.viewportProps.style,
            width: `${canvas.state().viewport.width}px`,
            height: `${canvas.state().viewport.height}px`,
            background: "#f4f1ea",
            "box-shadow": "inset 0 0 0 1px #8a8579",
          }}
        >
          <div data-part="layer" {...canvas.layerProps}>
            <For each={canvas.nodeIds()}>
              {(id) => {
                let editor: HTMLTextAreaElement | undefined;
                // The host's half of the editing contract: when the primitive says this node is
                // being edited, focus the editor. `user-select: text` re-enables selection inside
                // it (the layer sets `none`), and the editor is deliberately NOT a tab stop - F2
                // enters it, and Tab leaves the node, which ends editing.
                createEffect(
                  () => canvas.state().editing,
                  (editing) => {
                    if (editing === id) {
                      editor?.focus();
                    }
                  },
                );
                return (
                  <div data-part={`node${id}`} {...canvas.nodeProps(id)}>
                    {/* Culling is the host's job: the shell above always renders, the body
                        drops when the primitive says the node is culled (off screen and not
                        selected / focused / editing), so the node stays a focusable tab stop. */}
                    <Show when={!canvas.isCulled(id)}>
                      <Show
                        when={config.editor === true && canvas.state().editing === id}
                        fallback={
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "#fff",
                              border: "1px solid #3b6ea5",
                              "box-sizing": "border-box",
                              font: "14px system-ui",
                              padding: "6px",
                            }}
                          >
                            {labelOf(id)}
                          </div>
                        }
                      >
                        <textarea
                          ref={(element) => {
                            editor = element;
                          }}
                          data-part={`editor${id}`}
                          tabindex={-1}
                          style={{
                            width: "100%",
                            height: "100%",
                            "box-sizing": "border-box",
                            font: "14px system-ui",
                            "user-select": "text",
                          }}
                        />
                      </Show>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
        <div data-part="live" {...canvas.liveRegionProps}>
          {canvas.state().announcement}
        </div>
      </>
    );
  }, root);

  return {
    root,
    events,
    get canvas(): Canvas {
      if (api === undefined) {
        throw new Error("canvas fixture is not mounted");
      }
      return api;
    },
    setProp: () => {
      throw new Error("canvas steps go through the canvas driver");
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
