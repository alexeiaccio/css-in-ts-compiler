import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/scenario";
import type { WorkspaceMounted } from "./workspace.fixture";
import type { WorkspaceTarget, WorkspaceTab } from "../src/workspace";
import { flush } from "solid-js";

/**
 * The DOM side of the workspace scenario bridge. Every step is one of the
 * primitive's own calls (a pick, a drop with the target as data, a close) with
 * the target translated from the bridge's names; the observations read the DOM
 * the host rendered — `data-home`, `data-tabs`, `data-open`, `aria-selected`,
 * visibility — except for a tab that is `out` or `closed`: it has no element, so
 * its home is read from the primitive, exactly as the bridge's `attr` would.
 */
const TARGET: Readonly<Record<string, WorkspaceTarget>> = {
  "tab:0": "tabset0",
  "tab:1": "tabset1",
  tabF: "tabsetF",
  float: "float",
  "edge-left": "edge-left",
  "edge-right": "edge-right",
  "edge-top": "edge-top",
  "edge-bottom": "edge-bottom",
};

// Solid flushes on a microtask and runs effects after the DOM update; the host's
// focus effect then fires a `focusin` that writes the selection, so one task
// boundary plus a last flush is what makes the observation match the state.
const settle = async (): Promise<void> => {
  flush();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  flush();
};

export const workspaceDriver = (mounted: WorkspaceMounted): Driver => {
  const { root, workspace } = mounted;

  const tabOf = (target: string | undefined): WorkspaceTab => {
    const tab = workspace.tabs().find((candidate) => `tab:${String(candidate.id)}` === target);
    if (tab === undefined) {
      throw new Unsupported(`part ${target ?? ""}`);
    }
    return tab;
  };

  const perform = (step: ActionStep): void => {
    switch (step.event) {
      case "pick":
        workspace.pick(tabOf(step.target).id);
        break;
      case "drop": {
        const target = TARGET[step.target ?? ""];
        if (target === undefined) {
          throw new Unsupported(`target ${step.target ?? ""}`);
        }
        workspace.drop(target);
        break;
      }
      case "cancel":
        workspace.cancel();
        break;
      case "close": {
        const id = workspace.picked();
        if (id !== null) {
          workspace.close(id);
        }
        break;
      }
      case "copy": {
        const id = workspace.picked();
        if (id !== null) {
          workspace.copy(id);
        }
        break;
      }
      case "transferOut": {
        const id = workspace.picked();
        if (id !== null) {
          workspace.detach(id);
        }
        break;
      }
      case "attach": {
        // the model attaches the tab in hand, and only one that is out
        const id = workspace.picked();
        if (id !== null) {
          workspace.attach(tabOf(`tab:${String(id)}`));
        }
        break;
      }
      case "dock":
        workspace.dock();
        break;
      case "collapse":
        if (step.target === "tabset:0") {
          workspace.collapse("tabset0");
        } else if (step.target === "tabset:1") {
          workspace.collapse("tabset1");
        } else {
          throw new Unsupported(`part ${step.target ?? ""}`);
        }
        break;
      case "prop":
        mounted.setProp(step.prop ?? "", step.value);
        break;
      case "hover":
        workspace.hover(TARGET[step.target ?? ""] ?? null);
        break;
      case "unhover":
        workspace.hover(null);
        break;
      default:
        throw new Unsupported(`event ${step.event}`);
    }
  };

  const attr = (target: string, name: string): string | null => {
    const element = root.querySelector<HTMLElement>(`[data-part="${target}"]`);
    if (element !== null) {
      const value = element.getAttribute(name);
      return value;
    }
    // no element: a tab that left the window (detached or closed) has no home to
    // render, but the primitive still knows it
    const tab = workspace.tabs().find((candidate) => `tab:${String(candidate.id)}` === target);
    if (tab === undefined) {
      throw new Unsupported(`part ${target}`);
    }
    const home = workspace.home(tab.id);
    if (name === "data-home") {
      return home;
    }
    if (name === "aria-selected") {
      const selected = home !== "out" && home !== "closed" && workspace.active(home) === tab.id;
      return String(selected);
    }
    throw new Unsupported(`attribute ${name} on ${target}`);
  };

  return {
    perform: async (step) => {
      perform(step);
      await settle();
    },
    observer: {
      focus: () => mounted.focus?.() ?? null,
      attr,
      visible: () =>
        [...root.querySelectorAll<HTMLElement>("[data-part]")]
          .filter((element) => {
            const part = element.dataset["part"] ?? "";
            // the model knows tabs and tabsets; a host's indicator is outside it
            return /^(tab|tabset):/.test(part) && element.checkVisibility();
          })
          .map((element) => element.dataset["part"] ?? ""),
      events: (name) => mounted.events.get(name) ?? [],
      ...(mounted.value === undefined ? {} : { value: mounted.value }),
    },
    dispose: mounted.dispose,
  };
};
