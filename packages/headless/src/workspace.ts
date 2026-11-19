import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { type Tabs, createTabs } from "./tabs";

export type TabId = string | number;

/** Where a tab lives. `out` is detached and serialisable, `closed` is gone for good. */
export type WorkspaceHome = "tabset0" | "tabset1" | "float" | "edge" | "out" | "closed";

/** A container that can hold tabs (every home but the two exits). */
export type WorkspaceContainer = "tabset0" | "tabset1" | "float" | "edge";

export type WorkspaceEdge = "left" | "right" | "top" | "bottom";

/**
 * A drop target, as data: the host maps a pointer position to one and the
 * workspace never sees a pixel. `tabsetF` is the floating tabset itself (a move
 * into it), `float` is the empty background (a drop there shows the floating
 * tabset); the model tells them apart by the reason, not by the landing place.
 */
export type WorkspaceTarget =
  | "tabset0"
  | "tabset1"
  | "tabsetF"
  | "float"
  | "edge-left"
  | "edge-right"
  | "edge-top"
  | "edge-bottom";

/**
 * What the last event did — the spec's `reason`. `none` is a refusal: the drop
 * the model will not apply (or the host's `canDrop` veto) changed nothing and
 * left the tab in hand, so there is no layout to write back.
 */
export type WorkspaceReason =
  | "move"
  | "float"
  | "dock"
  | "copy"
  | "transfer"
  | "close"
  | "collapse"
  | "none";

/** One tab: an id the model knows and a payload it never sees. */
export interface WorkspaceTab {
  readonly id: TabId;
  /** Opaque host payload; `detach` hands it back untouched. */
  readonly data?: unknown;
}

/** A change the host may refuse before it lands (`canDrop`). */
export interface WorkspaceChange {
  readonly reason: "move" | "float" | "copy" | "close" | "transfer";
  readonly tab: WorkspaceTab;
  readonly from: WorkspaceHome;
  readonly to: WorkspaceHome;
  /** The drop target the host named, when the change came from a drop. */
  readonly target?: WorkspaceTarget;
}

/** Options are read lazily: pass an object with getters, never destructured values. */
export interface WorkspaceOptions {
  readonly tabs: ReadonlyArray<WorkspaceTab>;
  /**
   * The host policy: an emptied tabset stays in the row (flexlayout's
   * `enableDeleteWhenEmpty: false`). Off by default — an empty tabset goes away
   * and its collapse is reset with it. A tabset that is already gone is not
   * brought back by turning this on.
   */
  readonly keepWhenEmpty?: boolean;
  /** Start with the floating tabset open (the model starts with it hidden: a drop shows it). */
  readonly float?: boolean;
  /** A tab's spoken name for the live region ("Logs"); `String(id)` when absent. */
  readonly tabLabel?: (tab: WorkspaceTab) => string;
  /** The workspace's accessible name. */
  readonly name?: string;
  /** Base for the generated ids. */
  readonly id?: string;
  /**
   * The host's veto on a tab leaving its container — the `onBeforeModelChange`
   * seam: a change it refuses lands nowhere, says `reason = "none"` and keeps
   * the tab in hand so the interaction can continue.
   */
  readonly canDrop?: (change: WorkspaceChange) => boolean;
  /** The homes of every tab, in `tabs` order, after each landed change. */
  readonly onTabsChange?: (homes: ReadonlyArray<WorkspaceHome>) => void;
  /** A duplicate the host has to add: the workspace has no room for a new id. */
  readonly onCopy?: (tab: WorkspaceTab, target: WorkspaceTarget) => void;
  readonly onCollapse?: (left: boolean, right: boolean) => void;
  readonly onFloatingChange?: (open: boolean) => void;
  readonly onClose?: (tabs: ReadonlyArray<WorkspaceTab>) => void;
  /** A tab left the window (first list) or came back to it (second). */
  readonly onTransfer?: (
    left: ReadonlyArray<WorkspaceTab>,
    came: ReadonlyArray<WorkspaceTab>,
  ) => void;
}

/** A request to move DOM focus to a tab: the element is rebuilt when it changes tabset. */
export interface WorkspaceFocus {
  readonly id: TabId;
  /** Bumped per request, so asking for the same tab twice still runs the host's effect. */
  readonly nonce: number;
}

export interface WorkspaceGroupProps {
  readonly "data-part": "workspace";
  readonly role: "group";
  readonly "aria-label": string;
}

export interface WorkspaceTabsetProps {
  readonly "data-part": string;
  readonly role: "group";
  readonly "aria-label": string;
  readonly "data-tabs": number;
  readonly "data-open": "true" | "false";
  readonly "data-side": "none" | WorkspaceEdge;
  readonly "data-collapsed": "true" | "false";
  readonly hidden: boolean;
}

export interface WorkspaceTablistProps {
  readonly "data-part": string;
  readonly role: "tablist";
  readonly "aria-label": string;
  readonly "aria-orientation": "vertical" | undefined;
  readonly focusgroup: string;
  readonly dir: "ltr" | "rtl" | undefined;
  readonly ref: (element: HTMLElement) => void;
}

export interface WorkspaceTabProps {
  readonly "data-part": string;
  readonly "data-home": WorkspaceHome;
  readonly id: string;
  readonly role: "tab";
  readonly "aria-selected": "true" | "false";
  readonly "aria-controls": string;
  readonly "aria-disabled": "true" | undefined;
  readonly focusgroupstart: "" | undefined;
  readonly tabindex: -1 | undefined;
  readonly ref: (element: HTMLElement) => void;
  readonly onClick: () => void;
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface WorkspaceTabpanelProps {
  readonly "data-part": string;
  readonly id: string;
  readonly role: "tabpanel";
  readonly "aria-labelledby": string;
  readonly tabindex: 0 | undefined;
  readonly hidden: boolean;
}

/** The host-positioned box the floating tabset sits in. The model has no position. */
export interface WorkspaceFloatingProps {
  readonly "data-part": "floating";
  readonly role: "group";
  readonly "aria-label": string;
  readonly hidden: boolean;
}

/** Where a hover would land. A styling hook only: the model has no hover. */
export interface WorkspaceDropIndicatorProps {
  readonly "data-part": "drop-indicator";
  readonly "aria-hidden": "true";
  readonly hidden: boolean;
  readonly "data-target": WorkspaceTarget | undefined;
}

export interface WorkspaceLiveRegionProps {
  readonly "data-part": "live";
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface Workspace {
  /** The tabs, in host order (the order `onTabsChange` reports). */
  readonly tabs: Accessor<ReadonlyArray<WorkspaceTab>>;
  readonly home: (id: TabId) => WorkspaceHome;
  /** A tabset's tabs, in host order: the spec's `firstIn` is its first element. */
  readonly tabsIn: (container: WorkspaceContainer) => ReadonlyArray<WorkspaceTab>;
  readonly active: (container: WorkspaceContainer) => TabId | null;
  /** Whether the tabset is in the window at all (an empty one goes away unless `keepWhenEmpty`). */
  readonly tabsetOpen: (container: WorkspaceContainer) => boolean;
  /** The edge tabset's edge, `"none"` while it is absent. */
  readonly side: Accessor<"none" | WorkspaceEdge>;
  readonly collapsed: (container: "tabset0" | "tabset1") => boolean;
  /** The tab in hand (a pick, a drag), or `null`. */
  readonly picked: Accessor<TabId | null>;
  readonly reason: Accessor<WorkspaceReason>;
  /** The last landed change in words, for the live region. */
  readonly announcement: Accessor<string>;
  /** The drop target under the pointer, for the indicator (the model has none). */
  readonly hovered: Accessor<WorkspaceTarget | null>;
  /** Asks the host to put DOM focus on a tab after a change rebuilds its element. */
  readonly focusRequested: Accessor<WorkspaceFocus | null>;
  /** Take a tab in hand. A tab that is out or closed cannot be picked. */
  readonly pick: (id: TabId) => boolean;
  /** Land the tab in hand on `target`; a no-op the model refuses says `reason = "none"`. */
  readonly drop: (target: WorkspaceTarget) => boolean;
  readonly cancel: () => void;
  readonly close: (id: TabId) => boolean;
  /** Ask the host to duplicate `id` into the right tabset; the source does not move. */
  readonly copy: (id: TabId) => boolean;
  /** Take the tab out of the window as a serialisable value; it stays in hand. */
  readonly detach: (id: TabId) => WorkspaceTab | null;
  /** Place a tab that is `out` back into the right tabset. */
  readonly attach: (tab: WorkspaceTab | null) => boolean;
  /** Dissolve the floating tabset into the right one. */
  readonly dock: (focus?: TabId) => boolean;
  readonly collapse: (container: "tabset0" | "tabset1") => boolean;
  readonly hover: (target: WorkspaceTarget | null) => void;
  /**
   * The move chord for a focused tab: `Ctrl+Alt+Arrow` (or `Ctrl+Cmd` on macOS)
   * moves it along the row, floats it (Up) or docks (Down); `Delete` closes it.
   * Returns whether it handled the key — plain arrows are the tab list's.
   */
  readonly keyDown: (id: TabId, event: KeyboardEvent) => boolean;
  readonly groupProps: WorkspaceGroupProps;
  readonly tabsetProps: (container: WorkspaceContainer) => WorkspaceTabsetProps;
  readonly tablistProps: (container: WorkspaceContainer) => WorkspaceTablistProps;
  readonly tabProps: (container: WorkspaceContainer, tab: WorkspaceTab) => WorkspaceTabProps;
  readonly tabpanelProps: (
    container: WorkspaceContainer,
    tab: WorkspaceTab,
  ) => WorkspaceTabpanelProps;
  readonly floatingProps: WorkspaceFloatingProps;
  readonly dropIndicatorProps: WorkspaceDropIndicatorProps;
  readonly liveRegionProps: WorkspaceLiveRegionProps;
}

const CONTAINERS: ReadonlyArray<WorkspaceContainer> = ["tabset0", "tabset1", "float", "edge"];

/** The row: the two docked tabsets, left to right. The move chord walks this list. */
const ROW: ReadonlyArray<"tabset0" | "tabset1"> = ["tabset0", "tabset1"];

const PART: Readonly<Record<WorkspaceContainer, string>> = {
  tabset0: "tabset:0",
  tabset1: "tabset:1",
  float: "tabset:F",
  edge: "tabset:E",
};

const LIST_PART: Readonly<Record<WorkspaceContainer, string>> = {
  tabset0: "tablist:0",
  tabset1: "tablist:1",
  float: "tablist:F",
  edge: "tablist:E",
};

const NAME: Readonly<Record<WorkspaceContainer, string>> = {
  tabset0: "Left tabset",
  tabset1: "Right tabset",
  float: "Floating tabset",
  edge: "Edge tabset",
};

const DEST: Readonly<Record<WorkspaceTarget, WorkspaceHome>> = {
  tabset0: "tabset0",
  tabset1: "tabset1",
  tabsetF: "float",
  float: "float",
  "edge-left": "edge",
  "edge-right": "edge",
  "edge-top": "edge",
  "edge-bottom": "edge",
};

const SIDE: Readonly<Partial<Record<WorkspaceTarget, WorkspaceEdge>>> = {
  "edge-left": "left",
  "edge-right": "right",
  "edge-top": "top",
  "edge-bottom": "bottom",
};

const isContainer = (home: WorkspaceHome | undefined): home is WorkspaceContainer =>
  home === "tabset0" || home === "tabset1" || home === "float" || home === "edge";

/** One transition's starting point: what the callbacks compare the landing against. */
interface HomesSnapshot {
  readonly homes: ReadonlyArray<WorkspaceHome>;
  readonly left: boolean;
  readonly right: boolean;
  readonly floating: boolean;
}

/**
 * A workspace: tabs in tabsets, tabsets in a row with a floating and an edge
 * group (bean `cssints-vkrl`). The tabset half is APG Tabs (`./tabs`): one tab
 * list per tabset, roving focus, arrows inside a list, automatic activation. The
 * workspace adds the delta the spec models — a tab lives in exactly one home, a
 * drop names its target as data, an emptied tabset disappears unless
 * `keepWhenEmpty`, a move is destructive and a copy keeps its source, and a
 * refused drop changes nothing and keeps the tab in hand (`reason = "none"`).
 *
 * A tab leaves the window as a serialisable value (`detach`) and comes back
 * (`attach`); the transport (a `BroadcastChannel`, another window) is the host's.
 * Tear-off is deliberately absent: the platform reports no release position for
 * a drag that ends outside the window, so there is nothing to land on — an
 * "open in a window" button is the supported path.
 *
 * The keyboard move is **not** a drag: `Ctrl+Alt+ArrowLeft/Right` moves the
 * focused tab along the row, `Ctrl+Alt+ArrowUp` floats it, `Ctrl+Alt+ArrowDown`
 * docks the floating tabset, `Delete` closes a focused tab. That is VS Code's
 * Move Editor to Next/Previous Group, so the gesture has a precedent; `Ctrl+Cmd`
 * is accepted because macOS spells it that way. Plain arrows stay the tab list's
 * (the platform's focusgroup owns focus and activation) — the chord is only the
 * two-modifier form. A tabset that runs out of tabs renders no tab, so it leaves
 * no dead tab stop behind.
 *
 * Behaviour is `packages/apg-specs/specs/patterns/workspace.qnt`; the DOM is
 * checked against it by the differential walk and the ported scenarios.
 */
export const createWorkspace = (options: WorkspaceOptions): Workspace => {
  const base = options.id ?? createUniqueId();
  const [version, setVersion] = createSignal(0);
  const bump = (): void => {
    setVersion((count) => count + 1);
  };

  const keep = (): boolean => options.keepWhenEmpty === true;
  const nameOf = (tab: WorkspaceTab): string => options.tabLabel?.(tab) ?? String(tab.id);
  const tabOf = (id: TabId): WorkspaceTab | undefined => options.tabs.find((tab) => tab.id === id);

  const homes = new Map<TabId, WorkspaceHome>();
  const split = Math.ceil(options.tabs.length / 2);
  options.tabs.forEach((tab, index) => {
    homes.set(tab.id, index < split ? "tabset0" : "tabset1");
  });

  /** A tabset's tabs in host order; every read is reactive through `version`. */
  const members = (container: WorkspaceContainer): ReadonlyArray<WorkspaceTab> => {
    version();
    return options.tabs.filter((tab) => homes.get(tab.id) === container);
  };

  const firstId = (container: WorkspaceContainer): TabId | null =>
    members(container)[0]?.id ?? null;

  const active: Record<WorkspaceContainer, TabId | null> = {
    tabset0: firstId("tabset0"),
    tabset1: firstId("tabset1"),
    float: null,
    edge: null,
  };
  const exists: Record<"tabset0" | "tabset1", boolean> = {
    tabset0: members("tabset0").length > 0 || keep(),
    tabset1: members("tabset1").length > 0 || keep(),
  };
  let floatOn = options.float === true;
  let edge: "none" | WorkspaceEdge = "none";
  const collapsed: Record<"tabset0" | "tabset1", boolean> = {
    tabset0: false,
    tabset1: false,
  };
  let picked: TabId | null = null;
  let reason: WorkspaceReason = "none";
  let live = "";
  const [hovered, setHovered] = createSignal<WorkspaceTarget | null>(null);
  const [focusRequested, setFocusRequested] = createSignal<WorkspaceFocus | null>(null);
  let nonce = 0;

  const home = (id: TabId): WorkspaceHome => {
    version();
    return homes.get(id) ?? "closed";
  };

  const tabsetOpen = (container: WorkspaceContainer): boolean => {
    version();
    switch (container) {
      case "tabset0":
        return exists.tabset0;
      case "tabset1":
        return exists.tabset1;
      case "float":
        return floatOn;
      default:
        return edge !== "none";
    }
  };

  /**
   * The one generic landing the spec has: a tab arrives in `dest` (a container,
   * `out` or `closed`), the receiving container selects it, the one it left
   * re-selects what is still there, an emptied container stops existing unless
   * `keepWhenEmpty`, and the edge tabset records the edge its creation named.
   */
  const place = (
    tab: WorkspaceTab,
    dest: WorkspaceHome,
    side?: WorkspaceEdge,
    keepPick = false,
  ): void => {
    homes.set(tab.id, dest);
    for (const container of CONTAINERS) {
      const list = members(container);
      const current = active[container];
      if (container === dest) {
        active[container] = tab.id;
      } else if (list.length === 0) {
        active[container] = null;
      } else if (current === null || homes.get(current) !== container) {
        active[container] = list[0]?.id ?? null;
      }
    }
    exists.tabset0 = members("tabset0").length > 0 ? true : keep() ? exists.tabset0 : false;
    exists.tabset1 = members("tabset1").length > 0 ? true : keep() ? exists.tabset1 : false;
    floatOn = members("float").length > 0 ? true : keep() ? floatOn : false;
    const standing = members("edge").length > 0 ? true : keep() ? edge !== "none" : false;
    edge = standing ? (dest === "edge" && edge === "none" ? (side ?? "left") : edge) : "none";
    collapsed.tabset0 = exists.tabset0 ? collapsed.tabset0 : false;
    collapsed.tabset1 = exists.tabset1 ? collapsed.tabset1 : false;
    if (!keepPick && picked === tab.id) {
      picked = null;
    }
  };

  const snapshot = (): HomesSnapshot => ({
    homes: options.tabs.map((tab) => homes.get(tab.id) ?? "closed"),
    left: collapsed.tabset0,
    right: collapsed.tabset1,
    floating: floatOn,
  });

  const newly = (was: HomesSnapshot, now: HomesSnapshot, into: WorkspaceHome) =>
    now.homes.flatMap((where, index) => {
      const tab = options.tabs[index];
      return tab !== undefined && where === into && was.homes[index] !== into ? [tab] : [];
    });

  /** The six callbacks the spec's `events` derives from one transition. */
  const fire = (
    was: HomesSnapshot,
    copied?: { readonly tab: WorkspaceTab; readonly target: WorkspaceTarget },
  ): void => {
    const now = snapshot();
    if (now.homes.some((where, index) => where !== was.homes[index])) {
      options.onTabsChange?.(now.homes);
    }
    if (copied !== undefined) {
      options.onCopy?.(copied.tab, copied.target);
    }
    if (now.left !== was.left || now.right !== was.right) {
      options.onCollapse?.(now.left, now.right);
    }
    if (now.floating !== was.floating) {
      options.onFloatingChange?.(now.floating);
    }
    const closed = newly(was, now, "closed");
    if (closed.length > 0) {
      options.onClose?.(closed);
    }
    const left = newly(was, now, "out");
    const came = was.homes.flatMap((where, index) => {
      const tab = options.tabs[index];
      return tab !== undefined && where === "out" && now.homes[index] !== "out" ? [tab] : [];
    });
    if (left.length > 0 || came.length > 0) {
      options.onTransfer?.(left, came);
    }
  };

  const requestFocus = (id: TabId | null): void => {
    if (id === null) {
      return;
    }
    nonce += 1;
    setFocusRequested({ id, nonce });
  };

  const placeName = (dest: WorkspaceHome): string => {
    switch (dest) {
      case "tabset0":
        return "the left tabset";
      case "tabset1":
        return "the right tabset";
      case "float":
        return "the floating tabset";
      case "edge":
        return edge === "none" ? "the edge tabset" : `the ${edge} edge tabset`;
      default:
        return "another window";
    }
  };

  /** The host's veto: a refused change lands nowhere and keeps the tab in hand. */
  const vetoed = (tab: WorkspaceTab, verb: string, change: WorkspaceChange): boolean => {
    if (options.canDrop?.(change) !== false) {
      return false;
    }
    reason = "none";
    live = `${nameOf(tab)} cannot be ${verb}`;
    bump();
    return true;
  };

  /** A tab moving to a drop target — the one path a pointer drop and the chord share. */
  const relocate = (tab: WorkspaceTab, target: WorkspaceTarget): boolean => {
    const dest = DEST[target];
    const from = homes.get(tab.id);
    if (!isContainer(from) || dest === from) {
      reason = "none";
      bump();
      return false;
    }
    const next: WorkspaceReason = target === "float" ? "float" : "move";
    const change: WorkspaceChange = { reason: next, tab, from, to: dest, target };
    if (vetoed(tab, "dropped there", change)) {
      return false;
    }
    const was = snapshot();
    place(tab, dest, SIDE[target]);
    fire(was);
    reason = next;
    live =
      next === "float" ? `${nameOf(tab)} floated` : `${nameOf(tab)} moved to ${placeName(dest)}`;
    requestFocus(tab.id);
    bump();
    return true;
  };

  const pick = (id: TabId): boolean => {
    reason = "none";
    const from = homes.get(id);
    if (isContainer(from)) {
      picked = id;
    }
    bump();
    return isContainer(from);
  };

  const drop = (target: WorkspaceTarget): boolean => {
    const tab = picked === null ? undefined : tabOf(picked);
    if (tab === undefined) {
      reason = "none";
      bump();
      return false;
    }
    return relocate(tab, target);
  };

  const cancel = (): void => {
    picked = null;
    reason = "none";
    bump();
  };

  /** The active tab of the first tabset that still has one: where focus lands when its own is gone. */
  const firstActive = (): TabId | null => {
    for (const container of CONTAINERS) {
      const id = active[container];
      if (id !== null) {
        return id;
      }
    }
    return null;
  };

  const close = (id: TabId): boolean => {
    const tab = tabOf(id);
    const from = homes.get(id);
    if (tab === undefined || !isContainer(from)) {
      reason = "none";
      bump();
      return false;
    }
    if (vetoed(tab, "closed", { reason: "close", tab, from, to: "closed" })) {
      return false;
    }
    const was = snapshot();
    place(tab, "closed");
    fire(was);
    reason = "close";
    live = `${nameOf(tab)} closed`;
    // the tabset's new active tab is where the model puts the selection, so a
    // focused tab under automatic activation cannot fight the model
    requestFocus(active[from] ?? firstActive());
    bump();
    return true;
  };

  const copy = (id: TabId): boolean => {
    const tab = tabOf(id);
    const from = homes.get(id);
    if (tab === undefined || !isContainer(from)) {
      reason = "none";
      bump();
      return false;
    }
    if (vetoed(tab, "duplicated", { reason: "copy", tab, from, to: "tabset1" })) {
      return false;
    }
    const was = snapshot();
    if (picked === id) {
      picked = null;
    }
    fire(was, { tab, target: "tabset1" });
    reason = "copy";
    live = `${nameOf(tab)} duplicated to the right tabset`;
    bump();
    return true;
  };

  const detach = (id: TabId): WorkspaceTab | null => {
    const tab = tabOf(id);
    const from = homes.get(id);
    if (tab === undefined || !isContainer(from)) {
      reason = "none";
      bump();
      return null;
    }
    if (vetoed(tab, "detached", { reason: "transfer", tab, from, to: "out" })) {
      return null;
    }
    const was = snapshot();
    // a transfer keeps the tab in hand: the host is carrying it to the other window
    place(tab, "out", undefined, true);
    fire(was);
    reason = "transfer";
    live = `${nameOf(tab)} detached`;
    bump();
    return { id: tab.id, data: tab.data };
  };

  const attach = (tab: WorkspaceTab | null): boolean => {
    const known = tab === null ? undefined : tabOf(tab.id);
    if (known === undefined || homes.get(known.id) !== "out") {
      reason = "none";
      bump();
      return false;
    }
    if (vetoed(known, "attached", { reason: "transfer", tab: known, from: "out", to: "tabset1" })) {
      return false;
    }
    const was = snapshot();
    place(known, "tabset1");
    fire(was);
    reason = "transfer";
    live = `${nameOf(known)} attached`;
    requestFocus(known.id);
    bump();
    return true;
  };

  const dock = (focus?: TabId): boolean => {
    const floating = members("float");
    if (!floatOn && floating.length === 0) {
      reason = "none";
      bump();
      return false;
    }
    const was = snapshot();
    const current = active.tabset1;
    const stays =
      current !== null && (homes.get(current) === "tabset1" || homes.get(current) === "float");
    for (const tab of floating) {
      homes.set(tab.id, "tabset1");
    }
    active.tabset1 = stays ? current : firstId("tabset1");
    active.float = null;
    exists.tabset0 = members("tabset0").length > 0 ? true : keep() ? exists.tabset0 : false;
    exists.tabset1 = members("tabset1").length > 0 ? true : keep() ? exists.tabset1 : false;
    floatOn = false;
    collapsed.tabset0 = members("tabset0").length > 0 ? collapsed.tabset0 : false;
    collapsed.tabset1 = exists.tabset1 ? collapsed.tabset1 : false;
    fire(was);
    reason = "dock";
    live =
      floating.length === 1 && floating[0] !== undefined
        ? `${nameOf(floating[0])} docked to the right tabset`
        : `${floating.length} tabs docked to the right tabset`;
    requestFocus(focus ?? active.tabset1);
    bump();
    return true;
  };

  const collapse = (target: "tabset0" | "tabset1"): boolean => {
    const standing = exists[target];
    if (!standing && !collapsed[target]) {
      reason = "none";
      bump();
      return false;
    }
    const was = snapshot();
    collapsed[target] = standing ? !collapsed[target] : false;
    fire(was);
    reason = "collapse";
    live = `${NAME[target]} ${collapsed[target] ? "collapsed" : "expanded"}`;
    bump();
    return true;
  };

  const hover = (target: WorkspaceTarget | null): void => {
    setHovered(target);
  };

  /** A tab list's request to select a tab: the workspace owns the selection. */
  const setActive = (container: WorkspaceContainer, id: TabId): void => {
    if (homes.get(id) !== container || active[container] === id) {
      return;
    }
    active[container] = id;
    bump();
  };

  /**
   * The chord. `Ctrl+Alt+Arrow` (or `Ctrl+Cmd`) is the move; a plain arrow is the
   * tab list's, and this returns `false` for it so the platform's focusgroup runs.
   */
  const keyDown = (id: TabId, event: KeyboardEvent): boolean => {
    const tab = tabOf(id);
    if (tab === undefined) {
      return false;
    }
    const from = homes.get(id);
    if (event.key === "Delete") {
      if (event.ctrlKey || event.metaKey || event.altKey || !isContainer(from)) {
        return false;
      }
      close(id);
      return true;
    }
    if (!(event.ctrlKey && (event.altKey || event.metaKey))) {
      return false;
    }
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        const step = event.key === "ArrowLeft" ? -1 : 1;
        const index = from === "tabset0" ? 0 : from === "tabset1" ? 1 : -1;
        if (index === -1) {
          live = `${nameOf(tab)} is not in the tab row`;
          bump();
          return true;
        }
        const dest = ROW[index + step];
        if (dest === undefined) {
          live = `${nameOf(tab)} is at the ${step < 0 ? "left" : "right"} end of the row`;
          bump();
          return true;
        }
        relocate(tab, dest);
        return true;
      }
      case "ArrowUp":
        relocate(tab, "float");
        return true;
      case "ArrowDown":
        dock(id);
        return true;
      default:
        return false;
    }
  };

  // One APG tab list per tabset: the workspace owns the selection (`value`), the
  // list owns the roving stop, the arrows and the activation rules. A tab's local
  // index is its index in the host list, not in the tabset, so a tab keeps its
  // position (and its element, and its id) when it moves between tabsets — the
  // list renders only the tabs it holds, so the holes are never seen.
  const makeList = (container: WorkspaceContainer): Tabs =>
    createTabs({
      id: `${base}-${container}`,
      get items() {
        return options.tabs.length;
      },
      get value() {
        const id = active[container];
        return id === null ? -1 : options.tabs.findIndex((tab) => tab.id === id);
      },
      label: (index) => {
        const tab = options.tabs[index];
        return tab === undefined ? undefined : nameOf(tab);
      },
      onValueChange: (index) => {
        const tab = options.tabs[index];
        if (tab !== undefined) {
          setActive(container, tab.id);
        }
      },
    });

  const lists: Record<WorkspaceContainer, Tabs> = {
    tabset0: makeList("tabset0"),
    tabset1: makeList("tabset1"),
    float: makeList("float"),
    edge: makeList("edge"),
  };

  // A tab the workspace has not seen (one the host opened or pasted) joins the
  // right tabset: it is where the model's copy and attach land.
  createEffect(
    () => options.tabs,
    (tabs) => {
      let added = false;
      for (const tab of tabs) {
        if (!homes.has(tab.id)) {
          homes.set(tab.id, "tabset1");
          added = true;
        }
      }
      if (!added) {
        return;
      }
      for (const container of CONTAINERS) {
        if (active[container] === null) {
          active[container] = firstId(container);
        }
      }
      exists.tabset1 = true;
      bump();
    },
  );

  return {
    tabs: () => {
      version();
      return options.tabs;
    },
    home,
    tabsIn: members,
    active: (container) => {
      version();
      return active[container];
    },
    tabsetOpen,
    side: () => {
      version();
      return edge;
    },
    collapsed: (target) => {
      version();
      return collapsed[target];
    },
    picked: () => {
      version();
      return picked;
    },
    reason: () => {
      version();
      return reason;
    },
    announcement: () => {
      version();
      return live;
    },
    hovered,
    focusRequested,
    pick,
    drop,
    cancel,
    close,
    copy,
    detach,
    attach,
    dock,
    collapse,
    hover,
    keyDown,
    groupProps: {
      "data-part": "workspace",
      role: "group",
      "aria-label": options.name ?? "Workspace",
    },
    tabsetProps: (container) => ({
      "data-part": PART[container],
      role: "group",
      "aria-label": NAME[container],
      get "data-tabs"() {
        return members(container).length;
      },
      get "data-open"() {
        return tabsetOpen(container) ? "true" : "false";
      },
      // the edge side is the window's, so the bridge reads it off any tabset
      get "data-side"() {
        version();
        return edge;
      },
      get "data-collapsed"() {
        version();
        return container === "tabset0" || container === "tabset1"
          ? collapsed[container]
            ? "true"
            : "false"
          : "false";
      },
      get hidden() {
        return !tabsetOpen(container);
      },
    }),
    tablistProps: (container) => {
      const inner = lists[container].tablistProps;
      return {
        "data-part": LIST_PART[container],
        role: "tablist",
        "aria-label": `${NAME[container]} tabs`,
        get "aria-orientation"() {
          return inner["aria-orientation"];
        },
        get focusgroup() {
          return inner.focusgroup;
        },
        get dir() {
          return inner.dir;
        },
        get ref() {
          return inner.ref;
        },
      };
    },
    tabProps: (container, tab) => {
      const index = options.tabs.findIndex((member) => member.id === tab.id);
      const inner = lists[container].tabProps(index);
      return {
        "data-part": `tab:${String(tab.id)}`,
        get "data-home"() {
          version();
          return homes.get(tab.id) ?? "closed";
        },
        get id() {
          return inner.id;
        },
        role: "tab",
        get "aria-selected"() {
          return inner["aria-selected"];
        },
        get "aria-controls"() {
          return inner["aria-controls"];
        },
        get "aria-disabled"() {
          return inner["aria-disabled"];
        },
        get focusgroupstart() {
          return inner.focusgroupstart;
        },
        get tabindex() {
          return inner.tabindex;
        },
        ref: inner.ref,
        onClick: inner.onClick,
        onMouseDown: inner.onMouseDown,
        onFocus: inner.onFocus,
        onKeyDown: (event) => {
          if (keyDown(tab.id, event)) {
            event.preventDefault();
            return;
          }
          inner.onKeyDown(event);
        },
      };
    },
    tabpanelProps: (container, tab) => {
      const inner = lists[container].tabpanelProps(
        options.tabs.findIndex((member) => member.id === tab.id),
      );
      return {
        "data-part": "tabpanel",
        get id() {
          return inner.id;
        },
        role: "tabpanel",
        get "aria-labelledby"() {
          return inner["aria-labelledby"];
        },
        get tabindex() {
          return inner.tabindex;
        },
        get hidden() {
          return inner.hidden;
        },
      };
    },
    floatingProps: {
      "data-part": "floating",
      role: "group",
      "aria-label": "Floating tabset",
      get hidden() {
        return !tabsetOpen("float");
      },
    },
    dropIndicatorProps: {
      "data-part": "drop-indicator",
      "aria-hidden": "true",
      get hidden() {
        return hovered() === null;
      },
      get "data-target"() {
        return hovered() ?? undefined;
      },
    },
    liveRegionProps: {
      "data-part": "live",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  };
};
