import { For, createEffect, createSignal } from "solid-js";
import type { WorkspaceChange, WorkspaceContainer, WorkspaceTab } from "../src/workspace";
import type { Json, ScenarioConfig } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { createWorkspace } from "../src/workspace";
import { render } from "@solidjs/web";
import { workspaceConfig } from "@cssints/apg-specs/patterns/workspace.bridge";

/** The spec's tabs are ids 0..3; the payload is the host's, so the fixture names them. */
const LABELS = ["Logs", "Runs", "Files", "Preview"] as const;

export interface WorkspaceMounted extends Mounted {
  /** The primitive itself, for the browser tests' own assertions. */
  readonly workspace: ReturnType<typeof createWorkspace>;
}

/** The host seams the walk's config cannot carry (it is JSON). */
export interface WorkspaceFixtureOptions {
  readonly canDrop?: (change: WorkspaceChange) => boolean;
  readonly float?: boolean;
  readonly name?: string;
}

const configTabs = (tabs: ReadonlyArray<Json>): ReadonlyArray<WorkspaceTab> =>
  tabs.map((raw, index) => {
    const record =
      typeof raw === "object" && raw !== null && !Array.isArray(raw)
        ? (raw as Readonly<Record<string, Json>>)
        : {};
    const id = typeof record["id"] === "number" ? record["id"] : index;
    return { id, data: LABELS[index] ?? `tab ${index}` };
  });

/**
 * Renders `createWorkspace` as a group of four tabsets (two docked, one
 * floating, one edge), each with a tab list, tabs and panels, plus the floating
 * box, the drop indicator and the live region — every part carrying the
 * `data-part` the bridge names (`tabset:0`, `tab:2`, `tablist:F`, `live`, ...).
 *
 * A tabset that is not in the window stays in the DOM with `hidden` (it has no
 * tabs by construction), so its `data-open` / `data-tabs` are readable; a tab
 * that is `out` or `closed` has no element at all, because a detached tab is not
 * in the window. The fixture's `focus` is the tab **in hand**, which is what the
 * bridge calls focus: the spec models a drag, not a DOM focus.
 */
export const mountWorkspace = (
  config: ScenarioConfig,
  extra: WorkspaceFixtureOptions = {},
): WorkspaceMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const push = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };
  const normalized = workspaceConfig(config);
  const tabs = configTabs(normalized.tabs);
  const [keepWhenEmpty, setKeepWhenEmpty] = createSignal(normalized.keepWhenEmpty);
  let api: ReturnType<typeof createWorkspace> | undefined;

  const dispose = render(() => {
    const workspace = createWorkspace({
      tabs,
      get keepWhenEmpty() {
        return keepWhenEmpty();
      },
      tabLabel: (tab) => String(tab.data),
      float: extra.float === true,
      name: extra.name ?? "Workspace",
      ...(extra.canDrop === undefined ? {} : { canDrop: extra.canDrop }),
      onTabsChange: (homes) => push("onTabsChange", [...homes]),
      onCopy: (tab, target) => push("onCopy", [tab.id, target]),
      onCollapse: (left, right) => push("onCollapse", [left, right]),
      onFloatingChange: (open) => push("onFloatingChange", [open]),
      onClose: (closed) =>
        push(
          "onClose",
          closed.map((tab) => tab.id),
        ),
      onTransfer: (left, came) =>
        push(
          "onTransfer",
          [...left, ...came].map((tab) => tab.id),
        ),
    });
    api = workspace;
    // The host's half of the focus contract: a tab element is rebuilt when the
    // tab changes tabset, so the primitive asks and the host moves focus.
    createEffect(
      () => workspace.focusRequested(),
      (request) => {
        if (request === null) {
          return;
        }
        root.querySelector<HTMLElement>(`[data-part="tab:${String(request.id)}"]`)?.focus();
      },
    );
    const tabset = (container: WorkspaceContainer) => (
      <section {...workspace.tabsetProps(container)}>
        <div {...workspace.tablistProps(container)}>
          <For each={workspace.tabsIn(container)}>
            {(tab) => <button {...workspace.tabProps(container, tab)}>{String(tab.data)}</button>}
          </For>
        </div>
        <For each={workspace.tabsIn(container)}>
          {(tab) => (
            <div {...workspace.tabpanelProps(container, tab)}>
              {container}:{String(tab.data)}
            </div>
          )}
        </For>
      </section>
    );
    return (
      <div
        {...workspace.groupProps}
        style={{ display: "grid", "grid-template-columns": "1fr 1fr" }}
      >
        {tabset("tabset0")}
        {tabset("tabset1")}
        <div {...workspace.floatingProps}>{tabset("float")}</div>
        {tabset("edge")}
        <div {...workspace.dropIndicatorProps} />
        <div {...workspace.liveRegionProps}>{workspace.announcement()}</div>
      </div>
    );
  }, root);

  return {
    root,
    events,
    get workspace() {
      if (api === undefined) {
        throw new Error("workspace fixture is not mounted");
      }
      return api;
    },
    focus: () => {
      const id = api?.picked();
      return id === null || id === undefined ? null : `tab:${String(id)}`;
    },
    // The value the bridge compares: one home per tab, in host order.
    value: () => (api === undefined ? [] : api.tabs().map((tab) => api?.home(tab.id) ?? "closed")),
    setProp: (name, value) => {
      if (name === "keepWhenEmpty") {
        setKeepWhenEmpty(value === true);
        return;
      }
      throw new Error(`workspace fixture has no prop ${name}`);
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
