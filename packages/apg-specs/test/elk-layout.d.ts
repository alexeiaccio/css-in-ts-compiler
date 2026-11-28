// @openedges/elk-layout ships `typings/elk-api.d.ts` but its `exports` map does not expose it, so TypeScript cannot resolve
// the declarations of the import. This is the slice the oracle uses: a graph in, the laid-out graph out — node boxes, and
// each edge's polyline (start, bends, end), which is how a long edge's dummy nodes are read back from the drawing.
declare module "@openedges/elk-layout" {
  export interface LayoutedPoint {
    readonly x: number;
    readonly y: number;
  }

  export interface LayoutedSection {
    readonly startPoint: LayoutedPoint;
    readonly bendPoints?: ReadonlyArray<LayoutedPoint>;
    readonly endPoint: LayoutedPoint;
  }

  export interface LayoutedNode {
    readonly id: string;
    readonly x?: number;
    readonly y?: number;
    readonly width?: number;
    readonly height?: number;
  }

  export interface LayoutedEdge {
    readonly id: string;
    readonly sources?: ReadonlyArray<string>;
    readonly targets?: ReadonlyArray<string>;
    readonly sections?: ReadonlyArray<LayoutedSection>;
  }

  export interface LayoutedGraph {
    readonly children?: ReadonlyArray<LayoutedNode>;
    readonly edges?: ReadonlyArray<LayoutedEdge>;
  }

  export default class ELK {
    constructor(options?: unknown);
    layout(graph: unknown, options?: unknown): Promise<LayoutedGraph>;
  }
}
