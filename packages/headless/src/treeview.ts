import { type Accessor, createSignal } from "solid-js";
import { createControllable } from "./controllable";

/** A tree node: `parent` is 0 for a root; order in `nodes` is document order. */
export interface TreeviewNode {
  readonly id: number;
  readonly parent: number;
  readonly label: string;
}

/**
 * The fixed tree of `specs/apg/treeview.qnt` (ids are pre-order = document
 * order): 1 Projects > {2 Reports > {3 Roadmap, 4 Summary}, 5 Notes}, 6 Photos
 * > {7 Trip}.
 */
export const TREEVIEW_NODES: ReadonlyArray<TreeviewNode> = [
  { id: 1, parent: 0, label: "Projects" },
  { id: 2, parent: 1, label: "Reports" },
  { id: 3, parent: 2, label: "Roadmap" },
  { id: 4, parent: 2, label: "Summary" },
  { id: 5, parent: 1, label: "Notes" },
  { id: 6, parent: 0, label: "Photos" },
  { id: 7, parent: 6, label: "Trip" },
];

export interface TreeviewOptions {
  readonly nodes?: ReadonlyArray<TreeviewNode>;
  readonly multiSelectable?: boolean;
  /** Controlled: the host owns the selected node ids and this is the only thing that changes them. */
  readonly value?: ReadonlyArray<number> | undefined;
  /** Uncontrolled starting selected node ids; ignored while `value` is set. */
  readonly defaultValue?: ReadonlyArray<number>;
  /** Expanded node ids at mount. */
  readonly defaultExpanded?: ReadonlyArray<number>;
  /** Selected node ids at mount (an alias for `defaultValue`). */
  readonly defaultSelected?: ReadonlyArray<number>;
  /** Roving-tabindex node id at mount. */
  readonly defaultFocus?: number;
  readonly label?: string;
  readonly orientation?: "vertical" | "horizontal";
  /** Fires for each node whose expanded state changed, in document order. */
  readonly onExpandedChange?: (node: TreeviewNode) => void;
  /** Fires for each node that becomes selected. */
  readonly onSelectionChange?: (node: TreeviewNode) => void;
  /**
   * A request to change the selected node ids, called when the intent differs
   * from the current value. Uncontrolled it is accepted; controlled the host may
   * ignore it.
   */
  readonly onValueChange?: (selected: ReadonlyArray<number>) => void;
  /** Enter's default action. */
  readonly onActivate?: (node: TreeviewNode) => void;
}

/** Spread onto the element with `role=tree`. */
export interface TreeviewTreeProps {
  readonly role: "tree";
  readonly "aria-multiselectable": "true" | "false";
  readonly "aria-label": string | undefined;
  readonly "aria-orientation": "horizontal" | undefined;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocusIn: () => void;
  readonly onFocusOut: (event: FocusEvent) => void;
}

/** Spread onto the element with `role=treeitem` for `id`. */
export interface TreeviewItemProps {
  readonly role: "treeitem";
  readonly "aria-level": number;
  readonly "aria-setsize": number;
  readonly "aria-posinset": number;
  readonly "aria-expanded": "true" | "false" | undefined;
  readonly "aria-selected": "true" | "false";
  readonly tabindex: number;
  readonly hidden: boolean;
  readonly onClick: () => void;
}

export interface Treeview {
  readonly nodeIds: Accessor<ReadonlyArray<number>>;
  readonly expanded: Accessor<ReadonlyArray<number>>;
  readonly selected: Accessor<ReadonlyArray<number>>;
  readonly focus: Accessor<number>;
  readonly hasFocus: Accessor<boolean>;
  readonly isExpanded: (id: number) => boolean;
  readonly isSelected: (id: number) => boolean;
  readonly isVisible: (id: number) => boolean;
  readonly isParent: (id: number) => boolean;
  readonly expand: (id: number) => void;
  readonly collapse: (id: number) => void;
  readonly toggleExpanded: (id: number) => void;
  readonly select: (id: number) => void;
  readonly toggleSelected: (id: number) => void;
  /** Models the type-ahead timeout. */
  readonly resetTypeahead: () => void;
  /** Getter-backed, so spreading it keeps every attribute reactive. */
  readonly treeProps: TreeviewTreeProps;
  readonly itemProps: (id: number) => TreeviewItemProps;
}

interface Buffer {
  readonly first: string;
  readonly second: string;
}

const EMPTY: Buffer = { first: "", second: "" };

/**
 * APG Tree View (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): state
 * plus attribute objects for a `tree` and its `treeitem`s. No styling, no
 * elements. Behaviour is checked against `specs/apg/treeview.qnt` by the
 * scenario bridge and the differential walk, not by running the generated
 * machine here.
 *
 * ponytail: the buffer is capped at two characters and its timeout is the
 * explicit `resetTypeahead` method; add a timer when a consumer wants one.
 */
export const createTreeview = (options: TreeviewOptions = {}): Treeview => {
  const nodes = options.nodes ?? TREEVIEW_NODES;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ids = nodes.map((node) => node.id);
  const align = new Map(ids.map((id, index) => [id, 1 << index]));

  const weight = (id: number): number => align.get(id) ?? 0;
  const bit = (mask: number, id: number): boolean => (mask & weight(id)) !== 0;
  const setBit = (mask: number, id: number, on: boolean): number =>
    on ? mask | weight(id) : mask & ~weight(id);
  const maskOf = (list: ReadonlyArray<number> | undefined): number =>
    (list ?? []).reduce((mask, id) => setBit(mask, id, true), 0);
  const idsOfMask = (mask: number): ReadonlyArray<number> => ids.filter((id) => bit(mask, id));

  const parentOf = (id: number): number => byId.get(id)?.parent ?? 0;
  const childrenOf = (id: number): ReadonlyArray<number> =>
    id === 0
      ? ids.filter((child) => parentOf(child) === 0)
      : ids.filter((child) => parentOf(child) === id);
  const isParent = (id: number): boolean => childrenOf(id).length > 0;
  const nodeOf = (id: number): TreeviewNode => {
    const node = byId.get(id);
    if (node === undefined) {
      throw new Error(`unknown treeview node ${id}`);
    }
    return node;
  };
  const levelOf = (id: number): number => {
    let level = 1;
    let parent = parentOf(id);
    while (parent !== 0) {
      level += 1;
      parent = parentOf(parent);
    }
    return level;
  };

  const [expanded, setExpanded] = createSignal(maskOf(options.defaultExpanded));
  const [selectedMask, requestSelected] = createControllable<number>({
    value: () => (options.value === undefined ? undefined : maskOf(options.value)),
    initial: maskOf(options.defaultValue ?? options.defaultSelected),
    onChange: () => (next) => options.onValueChange?.(idsOfMask(next)),
  });
  const [focus, setFocus] = createSignal(options.defaultFocus ?? ids[0] ?? 1);
  const [hasFocus, setHasFocus] = createSignal(false);
  const [buffer, setBuffer] = createSignal<Buffer>(EMPTY);

  const multi = (): boolean => options.multiSelectable ?? false;
  const resetTypeahead = (): void => {
    setBuffer(EMPTY);
  };

  const visibleIn = (id: number): boolean => {
    let current = id;
    while (current !== 0) {
      const parent = parentOf(current);
      if (parent !== 0 && !bit(expanded(), parent)) {
        return false;
      }
      current = parent;
    }
    return true;
  };
  const visibleIds = (): ReadonlyArray<number> => ids.filter(visibleIn);

  const nextVisible = (id: number): number => {
    const visible = visibleIds();
    const index = visible.indexOf(id);
    return index >= 0 && index < visible.length - 1 ? (visible[index + 1] as number) : id;
  };
  const prevVisible = (id: number): number => {
    const visible = visibleIds();
    const index = visible.indexOf(id);
    return index > 0 ? (visible[index - 1] as number) : id;
  };

  const emitExpanded = (changed: ReadonlyArray<number>): void => {
    for (const id of changed) {
      options.onExpandedChange?.(nodeOf(id));
    }
  };

  const open = (id: number): void => {
    if (!isParent(id) || bit(expanded(), id)) {
      return;
    }
    setExpanded((mask) => setBit(mask, id, true));
    emitExpanded([id]);
  };
  const close = (id: number): void => {
    if (!isParent(id) || !bit(expanded(), id)) {
      return;
    }
    setExpanded((mask) => setBit(mask, id, false));
    emitExpanded([id]);
  };
  const toggleExpanded = (id: number): void => {
    if (!isParent(id)) {
      return;
    }
    if (bit(expanded(), id)) {
      close(id);
    } else {
      open(id);
    }
  };

  /**
   * A selection request: fire onValueChange (through `createControllable`, which
   * only calls when the intent differs) and report each newly requested node.
   * A controlled host may ignore the request, but the callback still fires.
   */
  const requestSelection = (next: number): void => {
    const before = selectedMask();
    if (next === before) {
      return;
    }
    requestSelected(next);
    for (const id of idsOfMask(next)) {
      if (!bit(before, id)) {
        options.onSelectionChange?.(nodeOf(id));
      }
    }
  };
  /** Single selection: replace the selection. */
  const select = (id: number): void => {
    requestSelection(weight(id));
  };
  const toggleSelected = (id: number): void => {
    requestSelection(setBit(selectedMask(), id, !bit(selectedMask(), id)));
  };
  const click = (id: number): void => {
    // The spec's click clears the type-ahead buffer even for hidden nodes.
    resetTypeahead();
    if (!visibleIn(id)) {
      return;
    }
    toggleExpanded(id);
    select(id);
    setFocus(id);
  };

  const label1 = (id: number): string => (byId.get(id)?.label ?? "").toLowerCase()[0] ?? "";
  const label2 = (id: number): string => (byId.get(id)?.label ?? "").toLowerCase()[1] ?? "";
  const matchTypeahead = (first: string, second: string): number => {
    if (first === "") {
      return 0;
    }
    const from = ids.indexOf(focus());
    const start = second === "" ? (from + 1) % ids.length : from;
    for (let step = 0; step < ids.length; step += 1) {
      const id = ids[(start + step) % ids.length] as number;
      if (visibleIn(id) && label1(id) === first && (second === "" || label2(id) === second)) {
        return id;
      }
    }
    return 0;
  };
  const typeahead = (character: string): void => {
    const current = buffer();
    const first =
      current.first === "" ? character : current.second === "" ? current.first : character;
    const second = current.first === "" ? "" : current.second === "" ? character : "";
    setBuffer({ first, second });
    const target = matchTypeahead(first, second);
    if (target !== 0) {
      setFocus(target);
    }
  };

  const expandSiblings = (id: number): void => {
    const parent = parentOf(id);
    const changed = ids.filter(
      (candidate) =>
        isParent(candidate) && parentOf(candidate) === parent && !bit(expanded(), candidate),
    );
    if (changed.length === 0) {
      return;
    }
    setExpanded((mask) => changed.reduce((next, candidate) => setBit(next, candidate, true), mask));
    emitExpanded(changed);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const current = focus();
    if (event.ctrlKey || event.metaKey) {
      if ((event.key === "a" || event.key === "A") && multi()) {
        event.preventDefault();
        const before = selectedMask();
        const all = ids.reduce((mask, id) => setBit(mask, id, true), 0);
        if (before === all) {
          requestSelection(0);
        } else {
          requestSelection(all);
        }
        resetTypeahead();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        resetTypeahead();
        const next = nextVisible(current);
        if (next !== current) {
          if (multi() && event.shiftKey) {
            toggleSelected(next);
          }
          setFocus(next);
        }
        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        resetTypeahead();
        const previous = prevVisible(current);
        if (previous !== current) {
          if (multi() && event.shiftKey) {
            toggleSelected(previous);
          }
          setFocus(previous);
        }
        return;
      }
      case "ArrowRight": {
        event.preventDefault();
        resetTypeahead();
        if (isParent(current) && bit(expanded(), current)) {
          setFocus(childrenOf(current)[0] ?? current);
        } else {
          toggleExpanded(current);
        }
        return;
      }
      case "ArrowLeft": {
        event.preventDefault();
        resetTypeahead();
        if (isParent(current) && bit(expanded(), current)) {
          toggleExpanded(current);
        } else if (parentOf(current) !== 0) {
          setFocus(parentOf(current));
        }
        return;
      }
      case "Home": {
        event.preventDefault();
        resetTypeahead();
        const first = visibleIds()[0];
        if (first !== undefined) {
          setFocus(first);
        }
        return;
      }
      case "End": {
        event.preventDefault();
        resetTypeahead();
        const visible = visibleIds();
        const last = visible[visible.length - 1];
        if (last !== undefined) {
          setFocus(last);
        }
        return;
      }
      case "Enter": {
        event.preventDefault();
        if (isParent(current)) {
          toggleExpanded(current);
        }
        if (!multi()) {
          select(current);
        }
        resetTypeahead();
        options.onActivate?.(nodeOf(current));
        return;
      }
      case " ":
      case "Spacebar": {
        event.preventDefault();
        if (multi()) {
          toggleSelected(current);
        } else {
          select(current);
        }
        resetTypeahead();
        return;
      }
      case "*": {
        event.preventDefault();
        expandSiblings(current);
        resetTypeahead();
        return;
      }
      default: {
        if ([...event.key].length === 1 && !event.altKey && !event.shiftKey && event.key !== " ") {
          event.preventDefault();
          typeahead(event.key.toLowerCase());
        }
      }
    }
  };

  return {
    nodeIds: () => ids,
    expanded: () => ids.filter((id) => bit(expanded(), id)),
    selected: () => idsOfMask(selectedMask()),
    focus,
    hasFocus,
    isExpanded: (id) => bit(expanded(), id),
    isSelected: (id) => bit(selectedMask(), id),
    isVisible: visibleIn,
    isParent,
    expand: open,
    collapse: close,
    toggleExpanded,
    select,
    toggleSelected,
    resetTypeahead,
    treeProps: {
      role: "tree",
      get "aria-multiselectable"() {
        return multi() ? "true" : "false";
      },
      get "aria-label"() {
        return options.label;
      },
      get "aria-orientation"() {
        return options.orientation === "horizontal" ? "horizontal" : undefined;
      },
      onKeyDown,
      onFocusIn: () => {
        setHasFocus(true);
      },
      onFocusOut: (event: FocusEvent) => {
        const related = event.relatedTarget;
        const staysInside =
          related instanceof Element && related.getAttribute("role") === "treeitem";
        if (!staysInside) {
          setHasFocus(false);
          resetTypeahead();
        }
      },
    },
    itemProps: (id: number) => ({
      role: "treeitem",
      "aria-level": levelOf(id),
      "aria-setsize": childrenOf(parentOf(id)).length,
      "aria-posinset": childrenOf(parentOf(id)).indexOf(id) + 1,
      get "aria-expanded"() {
        return isParent(id) ? (bit(expanded(), id) ? "true" : "false") : undefined;
      },
      get "aria-selected"() {
        return bit(selectedMask(), id) ? "true" : "false";
      },
      get tabindex() {
        return focus() === id ? 0 : -1;
      },
      get hidden() {
        return !visibleIn(id);
      },
      onClick: () => click(id),
    }),
  };
};
