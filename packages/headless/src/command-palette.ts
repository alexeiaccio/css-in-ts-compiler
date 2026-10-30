import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import {
  type DialogBackdropProps,
  type DialogContentProps,
  createDialogModal,
} from "./dialog-modal";
import { createHotkeys } from "./hotkeys";
import { type StatusProps, createStatus } from "./status";
import { type TextControlProps, createTextInput } from "./textbox";

/** One command the host offers; `group` only picks the heading the host renders. */
export interface PaletteCommand {
  readonly id: string;
  readonly label: string;
  readonly group?: string | undefined;
  readonly keywords?: ReadonlyArray<string> | undefined;
  readonly run: () => void | Promise<void>;
}

/** A command that survived the filter, in host order. */
export interface PaletteResult {
  readonly id: string;
  readonly label: string;
  readonly group: string | undefined;
}

/** Every string the host puts on screen; override what you translate. */
export interface CommandPaletteLabels {
  /** The dialog's name; `titleProps` heads it and the listbox is named by it. */
  readonly title: string;
  readonly placeholder: string;
  readonly empty: string;
  /** The result count the polite region announces, once per query. */
  readonly results: (count: number) => string;
}

export interface CommandPaletteOptions {
  readonly commands: ReadonlyArray<PaletteCommand>;
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean | undefined;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** The `createHotkeys` chord `attach` binds; `"mod+k"` by default. */
  readonly hotkey?: string | undefined;
  readonly labels?: Partial<CommandPaletteLabels> | undefined;
}

export interface CommandPalette {
  readonly open: Accessor<boolean>;
  readonly openPalette: () => void;
  readonly closePalette: () => void;
  readonly query: Accessor<string>;
  readonly setQuery: (text: string) => void;
  /** Index into `results()`; `-1` = the search field holds the highlight. */
  readonly active: Accessor<number>;
  readonly setActive: (index: number) => void;
  readonly results: Accessor<ReadonlyArray<PaletteResult>>;
  readonly labels: CommandPaletteLabels;
  /** The live region's text; render it inside `statusProps`. */
  readonly status: Accessor<string | undefined>;
  readonly inputProps: TextControlProps & {
    readonly role: "searchbox";
    readonly value: string;
    readonly "aria-controls": string;
    readonly "aria-activedescendant": string | undefined;
    readonly onKeyDown: (event: KeyboardEvent) => void;
  };
  readonly listProps: {
    readonly id: string;
    readonly role: "listbox";
    readonly "aria-labelledby": string;
    /** A pointer click keeps the focus in the search field. */
    readonly onMouseDown: (event: MouseEvent) => void;
  };
  readonly optionProps: (id: string) => {
    readonly id: string;
    readonly role: "option";
    readonly "aria-selected": "true" | "false";
    readonly tabindex: -1;
    readonly onClick: () => void;
    readonly onMouseEnter: () => void;
  };
  readonly emptyProps: { readonly hidden: boolean };
  readonly statusProps: StatusProps;
  readonly dialogProps: DialogContentProps;
  readonly backdropProps: DialogBackdropProps;
  readonly titleProps: { readonly id: string };
  /** Runs the active command and closes the palette; a no-op with no highlight. */
  readonly runActive: () => void | Promise<void>;
  /** Binds the hotkey on the document; call once and call the teardown on cleanup. */
  readonly attach: () => () => void;
}

const countLabel = (count: number): string =>
  count === 0 ? "No commands" : count === 1 ? "1 command" : `${count} commands`;

/**
 * A command palette: `createDialogModal` (a modal dialog, announced as one),
 * `createTextInput` (a `searchbox`, not a combobox — choosing runs a command,
 * it does not complete the field) and one filtered list. Focus stays in the
 * field; `aria-activedescendant` names the highlighted option, and ↓ on the
 * last / ↑ on the first return the highlight to the field. Home/End are menu
 * keys only while the field is empty, so the caret keeps them while typing.
 * Filtering is a plain case-insensitive substring match on the label and the
 * keywords, no fuzzy scoring: a palette is short and stable, and ranking
 * (recency, scopes) is a policy the host owns.
 *
 * The host's: rendering and grouping (the `group` field, headings, the CSS),
 * async commands (a rejected `run` is the host's to report), and any close
 * other than Escape / a command. `runActive` closes before it runs.
 */
export const createCommandPalette = (options: CommandPaletteOptions): CommandPalette => {
  const corpus = options.commands;
  const base = createUniqueId();
  const titleId = `${base}-title`;
  const listId = `${base}-list`;
  const optionId = (id: string): string => `${base}-option-${id}`;
  const labels: CommandPaletteLabels = {
    title: options.labels?.title ?? "Command palette",
    placeholder: options.labels?.placeholder ?? "Type a command",
    empty: options.labels?.empty ?? "No commands found",
    results: options.labels?.results ?? countLabel,
  };

  const filter = (text: string): ReadonlyArray<PaletteResult> => {
    const needle = text.toLowerCase();
    return corpus
      .filter(
        (command) =>
          command.label.toLowerCase().includes(needle) ||
          (command.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(needle)),
      )
      .map(({ id, label, group }) => ({ id, label, group }));
  };

  const [query, setQueryRaw] = createSignal("");
  const [active, setActiveRaw] = createSignal(0);
  const results = (): ReadonlyArray<PaletteResult> => filter(query());

  const dialog = createDialogModal({
    id: base,
    role: "dialog",
    labelledby: titleId,
    value: options.open,
    onOpenChange: (open) => options.onOpenChange?.(open),
  });
  const status = createStatus();

  const setQuery = (text: string): void => {
    // Solid 2 flushes on the microtask, so filter the new text directly.
    setQueryRaw(text);
    setActiveRaw(filter(text).length > 0 ? 0 : -1);
  };

  const run = (id: string): void | Promise<void> => {
    const chosen = corpus.find((command) => command.id === id);
    if (chosen === undefined) {
      return;
    }
    dialog.close();
    return chosen.run();
  };

  const runActive = (): void | Promise<void> => {
    const current = results()[active()];
    return current === undefined ? undefined : run(current.id);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.isComposing) {
      return;
    }
    const last = results().length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveRaw(active() < last ? active() + 1 : -1);
        return;
      case "ArrowUp":
        event.preventDefault();
        setActiveRaw(active() > 0 ? active() - 1 : last);
        return;
      case "Home":
      case "End":
        // With text the caret keeps the key; empty, it is a menu key.
        if (query() !== "") {
          return;
        }
        event.preventDefault();
        setActiveRaw(event.key === "Home" ? (last >= 0 ? 0 : -1) : last);
        return;
      case "Enter":
        event.preventDefault();
        void runActive();
        return;
      default:
        return;
    }
  };

  let returnFocus: HTMLElement | null = null;
  createEffect(
    () => dialog.open(),
    (isOpen) => {
      if (isOpen) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.getElementById(`${base}-control`)?.focus();
        return;
      }
      setQueryRaw("");
      setActiveRaw(0);
      const back = returnFocus;
      returnFocus = null;
      if (back !== null && back.isConnected) {
        back.focus();
      }
    },
  );

  // One write per query change: the arrows move the highlight, not the count.
  createEffect(
    () => [dialog.open(), results().length] as const,
    ([isOpen, count]) => {
      if (isOpen) {
        status.show(labels.results(count));
      } else {
        status.clear();
      }
    },
  );

  const input = createTextInput({
    id: base,
    type: "text",
    autoComplete: "off",
    spellCheck: false,
    placeholder: labels.placeholder,
    onValueChange: setQuery,
  });

  return {
    open: dialog.open,
    openPalette: dialog.openDialog,
    closePalette: dialog.close,
    query,
    setQuery,
    active,
    setActive: (index) => setActiveRaw(Math.max(-1, Math.min(index, results().length - 1))),
    results,
    labels,
    status: status.message,
    inputProps: {
      // The control props are static (labels are read once), so the spread
      // freezes no getter that could change.
      ...input.controlProps,
      role: "searchbox",
      get value() {
        return query();
      },
      "aria-controls": listId,
      get "aria-activedescendant"() {
        const current = results()[active()];
        return current === undefined ? undefined : optionId(current.id);
      },
      onKeyDown,
    },
    listProps: {
      id: listId,
      role: "listbox",
      "aria-labelledby": titleId,
      onMouseDown: (event) => event.preventDefault(),
    },
    // ponytail: a linear scan per option; a palette holds tens of commands.
    optionProps: (id) => ({
      id: optionId(id),
      role: "option",
      get "aria-selected"() {
        return results()[active()]?.id === id ? "true" : "false";
      },
      tabindex: -1,
      onClick: () => {
        if (results().some((result) => result.id === id)) {
          void run(id);
        }
      },
      onMouseEnter: () => {
        const index = results().findIndex((result) => result.id === id);
        if (index >= 0) {
          setActiveRaw(index);
        }
      },
    }),
    emptyProps: {
      get hidden() {
        return results().length > 0;
      },
    },
    statusProps: status.statusProps,
    dialogProps: dialog.dialogProps,
    backdropProps: dialog.backdropProps,
    titleProps: { id: titleId },
    runActive,
    attach: () => {
      const hotkeys = createHotkeys();
      const unbind = hotkeys.bind({
        keys: options.hotkey ?? "mod+k",
        allowInEditable: true,
        onTrigger: () => {
          if (dialog.open()) {
            dialog.close();
          } else {
            dialog.openDialog();
          }
        },
      });
      return () => {
        unbind();
        hotkeys.dispose();
      };
    },
  };
};
