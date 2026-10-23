import type { CanvasNodeInput } from "../src";

type Presentation = Pick<CanvasNodeInput, "label" | "role" | "roleDescription">;

/**
 * A minimal scene model for the canvas tests: just enough to drive
 * `createCanvas` from a tree of nodes, with no dependency on any record format.
 */
export type SceneContent =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "canvas"; readonly scene: string };

export interface SceneNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly order: number;
  readonly content: SceneContent;
}

export interface Scene {
  readonly nodes: readonly SceneNode[];
}

/** Stacking order: `order` ascending, a tie broken by id. */
// oxlint-disable-next-line automation/no-multiple-function-params
export const byOrder = (a: SceneNode, b: SceneNode): number =>
  a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const presentationOf = (content: SceneContent): Presentation =>
  content.kind === "text"
    ? {
        label: content.text,
        role: "article",
        roleDescription: "text note",
      }
    : {
        label: `Nested canvas ${content.scene.split("/").pop()}`,
        role: "figure",
        roleDescription: "nested canvas",
      };

/** The nodes as `createCanvas` input, bottom of the z-order first. */
export const sceneToCanvasNodes = (scene: Scene): CanvasNodeInput[] =>
  [...scene.nodes].sort(byOrder).map(({ id, x, y, width, height, content }) => ({
    id,
    x,
    y,
    width,
    height,
    ...presentationOf(content),
  }));
