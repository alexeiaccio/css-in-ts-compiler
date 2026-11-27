// @openedges/elk-layout ships `typings/elk-api.d.ts` but its `exports` map does not expose it, so TypeScript cannot resolve
// the declarations of the import. This is the slice the oracle uses: a graph in, the laid-out graph out.
declare module "@openedges/elk-layout" {
  export interface LayoutedNode {
    readonly id: string;
    readonly x?: number;
    readonly y?: number;
    readonly width?: number;
    readonly height?: number;
  }

  export interface LayoutedGraph {
    readonly children?: ReadonlyArray<LayoutedNode>;
  }

  export default class ELK {
    constructor(options?: unknown);
    layout(graph: unknown, options?: unknown): Promise<LayoutedGraph>;
  }
}
