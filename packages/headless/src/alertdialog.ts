import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export interface AlertDialogOptions {
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly value?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `value` is set. */
  readonly defaultOpen?: boolean;
  /** Starting textarea revision (0 = empty). */
  readonly defaultNotes?: number;
  readonly id?: string;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: (open: boolean) => void;
}

export interface AlertDialogTriggerProps {
  readonly id: string;
  readonly "aria-haspopup": "dialog";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly "aria-disabled": "true" | undefined;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface AlertDialogDialogProps {
  readonly id: string;
  readonly role: "alertdialog";
  readonly "aria-modal": "true" | undefined;
  readonly "aria-labelledby": string;
  readonly "aria-describedby": string;
  readonly tabindex: -1;
  readonly hidden: boolean;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface AlertDialogButtonProps {
  readonly id: string;
  readonly type: "button";
  readonly "aria-disabled": "true" | undefined;
  readonly onClick: () => void;
}

export interface AlertDialogBackdropProps {
  readonly id: string;
  readonly hidden: boolean;
  readonly onClick: () => void;
}

export interface AlertDialog {
  readonly open: Accessor<boolean>;
  /** Encoded focus target: `layer * 100 + position` (0 = none). */
  readonly focus: Accessor<number>;
  /** The part currently holding focus, in scenario vocabulary. */
  readonly focusPart: Accessor<string | null>;
  readonly notes: Accessor<number>;
  readonly stored: Accessor<number>;
  readonly focusAt: (target: number) => void;
  readonly activate: () => void;
  readonly escape: () => void;
  /**
   * Call before the host writes the controlled `value` directly, so a close
   * that is not the pending confirmation does not discard the notes.
   */
  readonly prepareHostWrite: () => void;
  readonly tab: () => void;
  readonly shiftTab: () => void;
  readonly typeText: () => void;
  readonly clearText: () => void;
  readonly ctrlS: () => void;
  readonly pointerOutside: () => void;
  readonly triggerProps: AlertDialogTriggerProps;
  readonly dialogProps: AlertDialogDialogProps;
  readonly backdropProps: AlertDialogBackdropProps;
  readonly cancelProps: AlertDialogButtonProps;
  readonly confirmProps: AlertDialogButtonProps;
  readonly saveProps: AlertDialogButtonProps;
  readonly inputProps: {
    readonly id: string;
    readonly "aria-label": string;
    readonly onFocus: () => void;
  };
}

// The spec's page (layer 0): 1 textarea, 2 Save, 3 Discard.
const NO_POS = 1; // least destructive
const YES_POS = 2; // destructive

/**
 * APG Alert Dialog on Solid 2: a Discard trigger, a notes textarea with Save,
 * and an alertdialog with No / Yes. Mirrors `specs/apg/alertdialog.qnt` —
 * `USE_ARIA_DISABLED` is on, so the emptied Discard stays focusable.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultOpen`);
 * pass `value` + `onOpenChange` to own the open state. `activate` / `escape` are
 * requests; the focus, return target and notes changes follow the committed
 * open state through an effect, so a rejected request leaves them untouched.
 */
export const createAlertDialog = (options: AlertDialogOptions = {}): AlertDialog => {
  const base = options.id ?? createUniqueId();

  const [open, requestOpen] = createControllable({
    value: () => options.value,
    initial: options.defaultOpen ?? false,
    onChange: () => options.onOpenChange,
  });

  let notes = options.defaultNotes ?? 1;
  let stored = 1;
  let focus = open() ? 100 + NO_POS : 1;
  let ret = open() ? 3 : 0;
  let pendingConfirm = false;

  const [version, setVersion] = createSignal(0);
  const notify = (): void => {
    setVersion((count) => count + 1);
  };

  // the open state commits (uncontrolled, or the controlled host writes it
  // back) and the entangled state follows it, so a rejected request is inert
  let lastOpen = open();
  createEffect(
    () => open(),
    (isOpen) => {
      if (isOpen === lastOpen) {
        return;
      }
      lastOpen = isOpen;
      if (isOpen) {
        ret = 3;
        focus = 100 + NO_POS;
      } else {
        if (pendingConfirm) {
          notes = 0;
          stored = 0;
          pendingConfirm = false;
        }
        focus = ret;
        ret = 0;
      }
      notify();
    },
  );

  const discardAriaDisabled = (): boolean => notes === 0;
  const saveAriaDisabled = (): boolean => notes === stored;
  const layer = (): number => (open() ? 1 : 0);
  // USE_ARIA_DISABLED keeps the emptied Discard in the tab sequence.
  const tabCount = (l: number): number => (l === 1 ? 2 : 3);
  const validPos = (l: number, pos: number): boolean => pos >= 1 && pos <= tabCount(l);
  const validTarget = (target: number): boolean =>
    Math.floor(target / 100) === layer() && validPos(layer(), target % 100);
  const nextPos = (pos: number, n: number): number => (pos >= n ? 1 : pos + 1);
  const prevPos = (pos: number, n: number): number => (pos <= 1 ? n : pos - 1);

  const partFor = (encoded: number, isOpen: boolean): string | null => {
    if (!isOpen) {
      if (encoded === 1) {
        return "input";
      }
      if (encoded === 2) {
        return "save";
      }
      return encoded === 3 ? "trigger" : null;
    }
    if (encoded === 101) {
      return "cancel";
    }
    return encoded === 102 ? "confirm" : null;
  };

  const save = (): void => {
    stored = notes;
    notify();
  };

  const activate = (): void => {
    if (open()) {
      if (focus === 100 + NO_POS) {
        pendingConfirm = false;
        requestOpen(false);
      } else if (focus === 100 + YES_POS) {
        pendingConfirm = true;
        requestOpen(false);
      }
      return;
    }
    if (focus === 3 && notes !== 0) {
      requestOpen(true);
    } else if (focus === 2 && notes !== stored) {
      save();
    }
  };

  const escape = (): void => {
    if (open()) {
      pendingConfirm = false;
      requestOpen(false);
    }
  };

  const tab = (): void => {
    const l = layer();
    focus = l * 100 + nextPos(focus % 100, tabCount(l));
    notify();
  };

  const shiftTab = (): void => {
    const l = layer();
    focus = l * 100 + prevPos(focus % 100, tabCount(l));
    notify();
  };

  const typeText = (): void => {
    if (!open() && focus === 1) {
      notes = notes === 1 ? 2 : 1;
      notify();
    }
  };

  const clearText = (): void => {
    if (!open() && focus === 1) {
      notes = 0;
      notify();
    }
  };

  const ctrlS = (): void => {
    if (!open() && focus === 1 && notes !== stored) {
      save();
    }
  };

  const focusAt = (target: number): void => {
    if (validTarget(target)) {
      focus = target;
      notify();
    }
  };

  const button = (onClick: () => void): AlertDialogButtonProps => ({
    id: `${base}-button`,
    type: "button",
    "aria-disabled": undefined,
    onClick,
  });

  return {
    open,
    focus: () => {
      version();
      return focus;
    },
    focusPart: () => {
      version();
      return partFor(focus, open());
    },
    notes: () => {
      version();
      return notes;
    },
    stored: () => {
      version();
      return stored;
    },
    focusAt,
    activate,
    escape,
    prepareHostWrite: () => {
      pendingConfirm = false;
    },
    tab,
    shiftTab,
    typeText,
    clearText,
    ctrlS,
    pointerOutside: () => {},
    triggerProps: {
      id: `${base}-trigger`,
      "aria-haspopup": "dialog",
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      "aria-controls": `${base}-dialog`,
      get "aria-disabled"() {
        version();
        return discardAriaDisabled() ? "true" : undefined;
      },
      onClick: () => {
        if (focus !== 3) {
          focus = 3;
        }
        activate();
      },
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (focus !== 3) {
            focus = 3;
          }
          activate();
        }
      },
    },
    dialogProps: {
      id: `${base}-dialog`,
      role: "alertdialog",
      get "aria-modal"() {
        return open() ? "true" : undefined;
      },
      "aria-labelledby": "title",
      "aria-describedby": "description",
      tabindex: -1,
      get hidden() {
        return !open();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape") {
          escape();
        }
      },
    },
    backdropProps: {
      id: `${base}-backdrop`,
      get hidden() {
        return !open();
      },
      onClick: () => {},
    },
    cancelProps: button(() => {
      focusAt(100 + NO_POS);
      activate();
    }),
    confirmProps: button(() => {
      focusAt(100 + YES_POS);
      activate();
    }),
    saveProps: {
      id: `${base}-save`,
      type: "button",
      get "aria-disabled"() {
        version();
        return saveAriaDisabled() ? "true" : undefined;
      },
      onClick: () => {
        focusAt(2);
        activate();
      },
    },
    inputProps: {
      id: `${base}-notes`,
      "aria-label": "Notes",
      onFocus: () => {
        if (!open() && focus !== 1) {
          focus = 1;
          notify();
        }
      },
    },
  };
};

export { NO_POS, YES_POS };
