import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/scenario";
import {
  GRAPH_LAYOUT_NODES,
  GRAPH_LAYOUT_PICKS,
  type GraphLayoutPick,
  layersOf,
} from "@cssints/apg-specs/patterns/graph-layout.bridge";
import { type Graph, type Layout, assignLayers, breakCycles, orderNodes } from "../src/index.ts";

/**
 * The engine as a scenario driver: the spec's `set_graph` picks one of its six graphs, the three phase steps are gated
 * exactly as the spec's actions are (out of order they are a no-op), and `layout` is all three at once.
 *
 * @returns {Driver} a fresh driver, its pipeline at the input phase
 */
export const engineDriver = (): Driver => {
  let graph: Graph | undefined;
  let oriented: Graph | undefined;
  let layerOf: ReadonlyMap<string, number> | undefined;
  let result: Layout | undefined;

  const broke = (): void => {
    if (graph !== undefined && oriented === undefined) {
      oriented = breakCycles(graph);
    }
  };
  const layered = (): void => {
    if (oriented !== undefined && layerOf === undefined) {
      layerOf = assignLayers(oriented);
    }
  };
  const ordered = (): void => {
    if (graph !== undefined && layerOf !== undefined && result === undefined) {
      result = orderNodes(graph.nodes, layerOf);
    }
  };

  return {
    perform: (action: ActionStep) => {
      switch (action.event) {
        case "set_graph": {
          const pick = action.value;
          if (typeof pick !== "number" || !Object.hasOwn(GRAPH_LAYOUT_PICKS, pick)) {
            throw new Unsupported(`graph ${JSON.stringify(pick)}`);
          }
          graph = {
            nodes: GRAPH_LAYOUT_NODES,
            edges: GRAPH_LAYOUT_PICKS[pick as GraphLayoutPick].edges.split(" ").map((pair) => {
              const [source, target] = pair.split(">");
              return { source: source ?? "", target: target ?? "" };
            }),
          };
          oriented = undefined;
          layerOf = undefined;
          result = undefined;
          return;
        }
        case "break_cycles":
          broke();
          return;
        case "assign_layers":
          layered();
          return;
        case "order_nodes":
          ordered();
          return;
        case "layout":
          broke();
          layered();
          ordered();
          return;
        default:
          throw new Unsupported(`event ${action.event}`);
      }
    },
    observer: {
      focus: () => null,
      visible: () => [],
      attr: (target, name) => {
        throw new Unsupported(`attribute ${name} on ${target}`);
      },
      events: () => [],
      value: () => {
        if (graph === undefined) {
          throw new Unsupported("graph");
        }
        return {
          layers: layersOf(
            graph.nodes.map((id) => ({
              id,
              x: layerOf?.get(id) ?? 0,
              y: result?.ranks[id] ?? 0,
            })),
          ),
        };
      },
    },
  };
};
