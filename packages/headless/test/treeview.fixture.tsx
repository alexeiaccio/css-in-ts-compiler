import { For, createEffect, createSignal } from "solid-js";
import { TREEVIEW_NODES, type Treeview, type TreeviewNode, createTreeview } from "../src/treeview";
import {
  type TreeviewConfig,
  nodeToPath,
  pathToNode,
} from "@cssints/apg-specs/apg/treeview.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { render } from "@solidjs/web";

export interface TreeviewMounted extends Mounted {
  readonly treeview: Treeview;
}

const idsOfMask = (mask: number): ReadonlyArray<number> =>
  [1, 2, 3, 4, 5, 6, 7].filter((id) => (mask & (1 << (id - 1))) !== 0);

/**
 * Renders `createTreeview` as a tree of `treeitem`s, each marked with its
 * slash path (`treeitem:0/1`), and exposes the `Mounted` the DOM driver needs.
 * Controlled, the fixture is the host: it keeps the selected node ids in a
 * signal, passes them as `value`, and either writes every request back
 * (`accepts`) or ignores it.
 */
export const mountTreeview = (config: TreeviewConfig): TreeviewMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, node: TreeviewNode): void => {
    events.set(name, [...(events.get(name) ?? []), nodeToPath(node.id)]);
  };
  const [host, setHost] = createSignal<ReadonlyArray<number>>(idsOfMask(config.selected));
  let api: Treeview | undefined;

  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled) {
      setHost([...next].sort((a, b) => a - b));
    }
  };

  const dispose = render(() => {
    const treeview = createTreeview({
      nodes: TREEVIEW_NODES,
      multiSelectable: config.multi,
      defaultExpanded: idsOfMask(config.expanded),
      defaultValue: idsOfMask(config.selected),
      defaultFocus: config.focus,
      get value() {
        return config.controlled ? host() : undefined;
      },
      ...(config.label === undefined ? {} : { label: config.label }),
      ...(config.orientation === undefined ? {} : { orientation: config.orientation }),
      onValueChange: (selected) => {
        if (config.accepts) {
          setHost([...selected].sort((a, b) => a - b));
        }
      },
      onExpandedChange: (node) => push("onExpandedChange", node),
      onSelectionChange: (node) => push("onSelectionChange", node),
      onActivate: (node) => push("onActivate", node),
    });
    api = treeview;
    // A consumer syncs real DOM focus to the primitive's roving node.
    createEffect(
      () => `${treeview.hasFocus()}|${treeview.focus()}`,
      () => {
        if (!treeview.hasFocus()) {
          return;
        }
        const roving = root.querySelector<HTMLElement>('[data-part="tree"] [tabindex="0"]');
        if (roving !== null && document.activeElement !== roving) {
          roving.focus();
        }
      },
    );
    return (
      <div data-part="tree" {...treeview.treeProps}>
        <For each={TREEVIEW_NODES}>
          {(node) => (
            <div data-part={nodeToPath(node.id)} {...treeview.itemProps(node.id)}>
              {node.label}
            </div>
          )}
        </For>
      </div>
    );
  }, root);

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
    get treeview(): Treeview {
      if (api === undefined) {
        throw new Error("treeview fixture is not mounted");
      }
      return api;
    },
  };
};
