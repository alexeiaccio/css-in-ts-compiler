import { type Canvas, ZONE, createCanvas } from "../src";
import { For, Show } from "solid-js";
import type { Scene, SceneContent, SceneNode } from "./scene";
import { render } from "@solidjs/web";
import { sceneToCanvasNodes } from "./scene";

/**
 * A host that renders a scene with `createCanvas`, and renders a canvas node as a SECOND
 * `createCanvas` in the node's body. Nothing here is a primitive change: the nesting is composition
 * plus the ownership rule of effects-of-atmosphere-3sj0 (the innermost canvas whose viewport contains
 * the target owns the event), wired by the nested viewport stopping propagation of its own events.
 */

const isCanvas = (content: SceneContent): content is Extract<SceneContent, { kind: "canvas" }> =>
  content.kind === "canvas";

const noFrames = (): void => {};
const ZOOM_IN = 1.25;
const ZOOM_OUT = 0.8;

/**
 * The scale a viewport inherits from ancestor CSS transforms: rendered width over layout width.
 * `getBoundingClientRect` folds every ancestor transform in, so a nested viewport under a zoomed
 * outer camera reads screen px; dividing by this recovers its own px. 1 when it cannot be measured.
 */
const scaleOf = (element: HTMLElement): number => {
  const rendered = element.getBoundingClientRect().width;
  return element.offsetWidth === 0 || rendered === 0 ? 1 : rendered / element.offsetWidth;
};

export interface SceneMountConfig {
  readonly scene: Scene;
  /** Nested scenes by at-uri: what a reader would load for a `#canvas` node. */
  readonly scenes?: Readonly<Record<string, Scene>>;
  readonly viewport?: { readonly width: number; readonly height: number };
}

export interface SceneMounted {
  readonly root: HTMLElement;
  /** A mounted canvas by DOM id base: `outer`, or `outer.<node id>` for the canvas in that node. */
  readonly canvas: (id: string) => Canvas;
  readonly viewport: (canvasId: string) => HTMLElement;
  readonly node: (canvasId: string, nodeId: string) => HTMLElement;
  readonly dispose: () => void;
}

interface SceneCanvasProps {
  readonly scene: Scene;
  readonly id: string;
  readonly label: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly scenes: Readonly<Record<string, Scene>>;
  readonly register: (id: string, canvas: Canvas) => void;
  /** Whether this canvas is the body of a node of another canvas. */
  readonly nested: boolean;
  /** The at-uris of the scenes already on this branch, so a repeat stops instead of recursing. */
  readonly ancestors: ReadonlySet<string>;
  /** Whether the nodes are in the Tab order of the page. */
  readonly tabbable: () => boolean;
}

const SceneCanvas = (props: SceneCanvasProps) => {
  const bodies = new Map(props.scene.nodes.map((node) => [node.id, node]));
  const canvas = createCanvas({
    id: props.id,
    label: props.label,
    nodes: sceneToCanvasNodes(props.scene),
    viewport: props.viewport,
    reducedMotion: true,
    requestFrame: noFrames,
  });
  props.register(props.id, canvas);
  const vp = canvas.viewportProps;
  // The ownership wiring: a nested viewport keeps its own events to itself.
  const own = (event: Event): void => {
    if (props.nested) {
      event.stopPropagation();
    }
  };

  const nestedOf = (
    id: string,
  ):
    | {
        readonly kind: "scene";
        readonly node: SceneNode;
        readonly scene: Scene;
        readonly uri: string;
      }
    | { readonly kind: "cycle" }
    | undefined => {
    const node = bodies.get(id);
    if (node === undefined || !isCanvas(node.content)) {
      return undefined;
    }
    const uri = node.content.scene;
    const scene = props.scenes[uri];
    if (scene === undefined) {
      return undefined;
    }
    // A scene that references an ancestor would recurse forever; the at-uri visited set is the
    // load-time guard (effects-of-atmosphere-qrsw), a rule the eventual scene reader must carry too.
    return props.ancestors.has(uri) ? { kind: "cycle" } : { kind: "scene", node, scene, uri };
  };

  return (
    <div
      data-part={`viewport:${props.id}`}
      {...vp}
      style={{
        ...vp.style,
        width: `${canvas.state().viewport.width}px`,
        height: `${canvas.state().viewport.height}px`,
        background: "#f4f1ea",
        "box-shadow": "inset 0 0 0 1px #8a8579",
      }}
      onPointerDown={(event) => {
        vp.onPointerDown(event);
        own(event);
      }}
      onPointerMove={(event) => {
        vp.onPointerMove(event);
        own(event);
      }}
      onPointerUp={(event) => {
        vp.onPointerUp(event);
        own(event);
      }}
      onPointerCancel={(event) => {
        vp.onPointerCancel(event);
        own(event);
      }}
      onKeyDown={(event) => {
        vp.onKeyDown(event);
        // Escape still reaches the frame: it is how the outer canvas leaves editing.
        if (event.key !== "Escape") {
          own(event);
        }
      }}
      onKeyUp={(event) => {
        vp.onKeyUp(event);
        own(event);
      }}
      onWheel={(event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const rect = element.getBoundingClientRect();
        const scale = scaleOf(element);
        canvas.zoomBy(Math.round(ZONE * (event.deltaY < 0 ? ZOOM_IN : ZOOM_OUT)), [
          (event.clientX - rect.left) / scale - element.clientLeft,
          (event.clientY - rect.top) / scale - element.clientTop,
        ]);
        own(event);
      }}
    >
      <div data-part={`layer:${props.id}`} {...canvas.layerProps}>
        <For each={canvas.nodeIds()}>
          {(id) => {
            const inner = nestedOf(id);
            const label = canvas.nodeProps(id)["aria-label"];
            const recurse = inner?.kind === "scene" ? inner : undefined;
            return (
              <div
                data-part={`node:${props.id}:${id}`}
                {...canvas.nodeProps(id)}
                tabindex={props.tabbable() ? 0 : -1}
              >
                <Show when={!canvas.isCulled(id)}>
                  <Show
                    when={recurse}
                    fallback={
                      <div
                        data-part={`figure:${props.id}:${id}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#fff",
                          border: "1px solid #3b6ea5",
                          "box-sizing": "border-box",
                          font: "14px system-ui",
                        }}
                      >
                        {inner?.kind === "cycle" ? `${label} (repeats an ancestor scene)` : label}
                      </div>
                    }
                  >
                    {recurse === undefined ? null : (
                      <SceneCanvas
                        scene={recurse.scene}
                        id={`${props.id}.${id}`}
                        label={label}
                        viewport={{
                          width: recurse.node.width,
                          height: recurse.node.height,
                        }}
                        scenes={props.scenes}
                        ancestors={new Set([...props.ancestors, recurse.uri])}
                        register={props.register}
                        nested
                        // Explicit entry (3sj0): the inner nodes are tab stops only while the
                        // outer canvas is editing this frame (F2 on the selected frame).
                        tabbable={() => canvas.state().editing === id}
                      />
                    )}
                  </Show>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export const mountScene = (config: SceneMountConfig): SceneMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const canvases = new Map<string, Canvas>();
  const dispose = render(
    () => (
      <SceneCanvas
        scene={config.scene}
        id="outer"
        label="Outer canvas"
        viewport={config.viewport ?? { width: 360, height: 300 }}
        scenes={config.scenes ?? {}}
        register={(id, canvas) => canvases.set(id, canvas)}
        nested={false}
        ancestors={new Set()}
        tabbable={() => true}
      />
    ),
    root,
  );
  const part = (name: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
    if (element === null) {
      throw new Error(`no part ${name}`);
    }
    return element;
  };
  return {
    root,
    canvas: (id) => {
      const canvas = canvases.get(id);
      if (canvas === undefined) {
        throw new Error(`no canvas ${id}`);
      }
      return canvas;
    },
    viewport: (canvasId) => part(`viewport:${canvasId}`),
    node: (canvasId, nodeId) => part(`node:${canvasId}:${nodeId}`),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

// ---- synthetic input (the same path the canvas driver uses) -------------------------------------

export const centreOf = (element: Element): readonly [number, number] => {
  const rect = element.getBoundingClientRect();
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
};

/** A bubbling pointer event at client coordinates, dispatched on `target`. */
export const pointer = (
  target: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  pointerId: number,
  at: readonly [number, number],
): void => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: at[0],
      clientY: at[1],
    }),
  );
};

export const wheel = (target: Element, deltaY: number, at: readonly [number, number]): void => {
  target.dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      composed: true,
      deltaY,
      clientX: at[0],
      clientY: at[1],
    }),
  );
};

export const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
