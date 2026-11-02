import { TREEVIEW_NODES, type Treeview as TreeviewController } from "@cssints/headless";
import {
  type TreeviewConfig,
  nodeToPath,
  pathToNode,
} from "@cssints/apg-specs/apg/treeview.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./treeview-driver.ts";
import { Treeview } from "./treeview.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

export interface TreeviewMounted extends Mounted {
  readonly treeview: TreeviewController;
}

const idsOfMask = (mask: number): ReadonlyArray<number> =>
  [1, 2, 3, 4, 5, 6, 7].filter((id) => (mask & (1 << (id - 1))) !== 0);

/**
 * Mounts the styled tree for the scenario walk: the fixed seven-node tree of the spec, the
 * primitive it built through `onReady`, and the callback payloads the walk reads (one slash path per
 * node). Controlled, the fixture is the host: it keeps the selected node ids in a signal, passes
 * them as `value`, and either writes every request back (`accepts`) or ignores it.
 *
 * @param {TreeviewConfig} config the state the walk starts from and the host's policy
 * @returns {TreeviewMounted} the mounted tree and the driver's view of it
 */
export const mountTreeview = (config: TreeviewConfig): TreeviewMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, node: number): void => {
    events.set(name, [...(events.get(name) ?? []), nodeToPath(node)]);
  };
  const [host, setHost] = createSignal<ReadonlyArray<number>>(idsOfMask(config.selected));
  let api: TreeviewController | undefined;

  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled) {
      setHost([...next].sort((a, b) => a - b));
    }
  };

  const dispose = render(
    () => (
      <Treeview
        nodes={TREEVIEW_NODES}
        label={config.label ?? "Files"}
        multiSelectable={config.multi}
        defaultExpanded={idsOfMask(config.expanded)}
        defaultValue={idsOfMask(config.selected)}
        defaultFocus={config.focus}
        value={config.controlled ? host() : undefined}
        orientation={config.orientation}
        onReady={(tree) => {
          api = tree;
        }}
        onValueChange={(selected) => {
          if (config.accepts) {
            setHost([...selected].sort((a, b) => a - b));
          }
        }}
        onExpandedChange={(node) => push("onExpandedChange", node.id)}
        onSelectionChange={(node) => push("onSelectionChange", node.id)}
        onActivate={(node) => push("onActivate", node.id)}
      />
    ),
    root,
  );

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "resetTypeahead":
          api?.resetTypeahead();
          return;
        case "selected":
        case "setValue":
          if (!Array.isArray(value)) {
            throw new Error(`selected needs an array, got ${JSON.stringify(value)}`);
          }
          writeHost(value.map((path) => pathToNode(String(path))));
          return;
        case "hostToggle":
          writeHost(host().includes(1) ? host().filter((id) => id !== 1) : [...host(), 1]);
          return;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => (api?.hasFocus() === true ? nodeToPath(api.focus()) : null),
    dispose: () => {
      dispose();
      root.remove();
    },
    get treeview(): TreeviewController {
      if (api === undefined) {
        throw new Error("treeview fixture is not mounted");
      }
      return api;
    },
  };
};
