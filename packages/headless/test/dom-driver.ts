import { type ActionStep, type Driver, type Json, Unsupported } from "@cssints/apg-specs/scenario";
import { flush } from "solid-js";
import { userEvent } from "vite-plus/test/browser";

/**
 * The generic DOM side of the scenario bridge. A pattern's fixture renders its
 * parts with `data-part="<name>"` and returns a `Mounted`; this turns scenario
 * steps into real pointer/keyboard input and DOM reads into observations.
 */
export interface Mounted {
  readonly root: HTMLElement;
  /** Apply a scenario `prop` step (programmatic input) to the mounted widget. */
  readonly setProp: (name: string, value: Json | undefined) => void;
  /** Callback payloads, recorded under their canonical name. */
  readonly events: ReadonlyMap<string, ReadonlyArray<Json>>;
  readonly value?: () => Json;
  /**
   * The part the primitive itself considers focused (`trigger`, `tab:1`), or
   * `null` for "outside the widget". The walk's focus observation: the DOM lags
   * the state that produced it, the primitive does not (see "Walking the DOM" in
   * the README).
   */
  readonly focus?: () => string | null;
  readonly dispose: () => void;
}

export interface DomDriverOptions {
  /** Parts that can be hidden: the ones `expect.visible` lists. */
  readonly hideableParts: ReadonlyArray<string>;
  readonly eventName?: (name: string) => string;
}

const BOOLEAN_ATTRS = new Set(["hidden", "disabled"]);
const REFERENCE_ATTRS = new Set([
  "aria-controls",
  "aria-labelledby",
  "aria-owns",
  "aria-activedescendant",
]);
const NAMED_KEYS = new Set(["Enter", "Tab", "Escape", "Backspace", "Delete", "Home", "End"]);

// Solid renders on its own schedule, but `flush()` applies the queued signal work
// synchronously. One macrotask then lets a platform reaction (the focusgroup's
// focus move, user-event's own bookkeeping) land before the walk reads, without a
// frame — a frame also lets the browser's focus fixup run. Nothing waits on the
// DOM: the walk reads focus from the primitive (`Mounted.focus`) and the driver
// writes it, so a late frame cannot change what the walk sees.
const settle = (): Promise<void> => {
  flush();
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

const keyboardSyntax = (key: string): string => {
  if (key === "Space" || key === " ") {
    return " ";
  }
  return NAMED_KEYS.has(key) || key.startsWith("Arrow") || key.startsWith("Page")
    ? `{${key}}`
    : key;
};

// A held key is always written by name: `{Space>}` keeps it down, `{/Space}`
// releases it wherever focus is at that moment (a blur between the two halves
// is exactly what a walk needs to see).
const keyName = (key: string) => (key === " " || key === "Space" ? "Space" : key);

/** `KeyboardEvent.key` uses a space character, not the `Space` alias. */
const eventKey = (key: string) => (key === "Space" ? " " : key);

const CLICKABLE_INPUT_TYPES = new Set([
  "button",
  "color",
  "file",
  "image",
  "reset",
  "submit",
  "checkbox",
  "radio",
]);

/**
 * A half press is dispatched directly (not through user-event's held-key state,
 * which auto-releases on a repeated down and leaks across walk drivers). The
 * two native activations user-event would otherwise add are emulated: Space
 * clicks a button-like element on keyup, Enter on keydown.
 */
const halfPress = (target: EventTarget | null, type: "keydown" | "keyup", key: string) => {
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const keyValue = eventKey(key);
  const notPrevented = target.dispatchEvent(
    new KeyboardEvent(type, {
      key: keyValue,
      code: keyName(key),
      bubbles: true,
      cancelable: true,
    }),
  );
  const clickable =
    target.tagName === "BUTTON" ||
    (target instanceof HTMLInputElement && CLICKABLE_INPUT_TYPES.has(target.type));
  if (
    notPrevented &&
    clickable &&
    ((type === "keyup" && keyValue === " ") || (type === "keydown" && keyValue === "Enter"))
  ) {
    target.click();
  }
};

export const domDriver = (mounted: Mounted, options: DomDriverOptions): Driver => {
  const { root } = mounted;
  const canonical = options.eventName ?? ((name: string) => name);

  const partsOf = (name: string): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`),
  ];

  const targetOf = (element: HTMLElement): string => {
    const name = element.dataset["part"] ?? "";
    return `${name}:${partsOf(name).indexOf(element)}`;
  };

  const elementOf = (target: string): HTMLElement => {
    const [name = "", index = "0"] = target.split(":");
    const element = partsOf(name)[Number(index)];
    if (element === undefined) {
      throw new Unsupported(`part ${target}`);
    }
    return element;
  };

  const click = async (element: HTMLElement): Promise<void> => {
    // a disabled button is not actionable; force lets the browser drop the click itself
    await userEvent.click(element, { force: true });
  };

  const partElement = (part: string): HTMLElement | undefined => {
    const [name = "", index = "0"] = part.split(":");
    return partsOf(name)[Number(index)];
  };

  /**
   * Where a `key` step's key is pressed. The step names its target; when that
   * target is the widget's owner (a menu, a grid) the key belongs to the part the
   * primitive says is focused, not to the container — a user's focus is on the
   * item, and the platform's key handling reads the item. The driver moves that
   * focus itself: a fixture reports focus (`Mounted.focus`), it does not write it
   * (see the README's walk section).
   */
  const keyTarget = (target: string): HTMLElement => {
    const element = elementOf(target);
    const focusedPart = mounted.focus?.();
    if (focusedPart !== null && focusedPart !== undefined) {
      const focused = partElement(focusedPart);
      if (focused !== undefined && focused !== element && element.contains(focused)) {
        return focused;
      }
    }
    return element;
  };

  // Half presses this driver dispatched a keydown for, so a stray `phase: "up"`
  // stays inert (the spec's key_up only fires on an armed press).
  const halfHeld = new Set<string>();

  // A programmatic step is not a pointer input: the pointer sits at a page
  // coordinate the walk does not control, and when a step opens a list under it
  // the browser dispatches `mouseover`/`mouseenter` on the row that appeared — a
  // hover the model never asked for (and a menu that focuses on hover moves the
  // primitive to that row). Pointer events are stopped at the widget while the
  // driver is not performing a pointer step.
  let pointerInput = false;
  const guard = (event: Event): void => {
    if (!pointerInput) {
      event.stopPropagation();
    }
  };
  for (const name of ["mouseover", "mouseenter", "pointerover", "pointerenter"] as const) {
    root.addEventListener(name, guard, true);
  }

  return {
    perform: async (step: ActionStep) => {
      pointerInput =
        step.event === "click" ||
        step.event === "hover" ||
        step.event === "unhover" ||
        step.event === "pointerdown" ||
        step.event === "pointerup" ||
        step.event === "pointercancel";
      switch (step.event) {
        case "focus":
          elementOf(step.target ?? "").focus();
          break;
        case "blur":
          halfHeld.clear();
          elementOf(step.target ?? "").blur();
          break;
        case "click":
          await click(elementOf(step.target ?? ""));
          break;
        case "pointerdown":
          elementOf(step.target ?? "").focus();
          elementOf(step.target ?? "").dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              cancelable: true,
              pointerType: step.pointerType ?? "mouse",
            }),
          );
          break;
        case "pointerup": {
          const element = elementOf(step.target ?? "");
          element.dispatchEvent(
            new PointerEvent("pointerup", {
              bubbles: true,
              cancelable: true,
              pointerType: step.pointerType ?? "mouse",
            }),
          );
          // a released pointer button is a click, as the browser would deliver it
          element.click();
          break;
        }
        case "pointercancel":
          elementOf(step.target ?? "").dispatchEvent(
            new PointerEvent("pointercancel", {
              bubbles: true,
              cancelable: true,
              pointerType: step.pointerType ?? "mouse",
            }),
          );
          break;
        case "hover":
          await userEvent.hover(elementOf(step.target ?? ""));
          break;
        case "unhover":
          await userEvent.unhover(elementOf(step.target ?? ""));
          break;
        case "key": {
          if (step.phase === "down") {
            const element = keyTarget(step.target ?? "");
            if (document.activeElement !== element) {
              element.focus();
            }
            // a disabled/read-only control never arms (the spec's spaceArms
            // guard), so a later `up` must not activate it either
            const blocked =
              element.getAttribute("aria-disabled") === "true" ||
              element.getAttribute("aria-readonly") === "true" ||
              (element instanceof HTMLButtonElement && element.disabled);
            if (!blocked) {
              halfHeld.add(keyName(step.key ?? ""));
            }
            halfPress(element, "keydown", step.key ?? "");
            break;
          }
          if (step.phase === "up") {
            if (!halfHeld.delete(keyName(step.key ?? ""))) {
              break;
            }
            // release wherever focus went: deliberately do NOT re-focus the
            // target, or a keydown -> blur -> keyup walk would be defeated
            const active = document.activeElement;
            halfPress(
              active instanceof HTMLElement ? active : document.body,
              "keyup",
              step.key ?? "",
            );
            break;
          }
          const element = keyTarget(step.target ?? "");
          if (document.activeElement !== element) {
            element.focus();
          }
          // a whole press releases the key, so a later `phase: "up"` is inert
          halfHeld.delete(keyName(step.key ?? ""));
          await userEvent.keyboard(keyboardSyntax(step.key ?? ""));
          break;
        }
        case "prop":
          if (step.set !== undefined) {
            for (const [name, value] of Object.entries(step.set)) {
              mounted.setProp(name, value);
              if ((name === "disabled" || name === "isDisabled") && value === true) {
                // the spec drops a pending press when the control disables
                halfHeld.clear();
              }
            }
          } else {
            mounted.setProp(step.prop ?? "", step.value);
            if ((step.prop === "disabled" || step.prop === "isDisabled") && step.value === true) {
              halfHeld.clear();
            }
          }
          break;
        default:
          throw new Unsupported(`event ${step.event}`);
      }
      await settle();
      pointerInput = false;
    },
    observer: {
      focus: () => {
        // The primitive's own focus is the observation: a fixture that mirrors
        // its state into DOM focus has that mirror's focus event land later, so
        // `document.activeElement` is the one thing that lags under load.
        if (mounted.focus !== undefined) {
          return mounted.focus();
        }
        const active = document.activeElement;
        const part =
          active instanceof HTMLElement ? active.closest<HTMLElement>("[data-part]") : null;
        return part !== null && root.contains(part) ? targetOf(part) : null;
      },
      attr: (target, name) => {
        if (name.startsWith("data-")) {
          throw new Unsupported(`styling hook ${name}`);
        }
        const value = elementOf(target).getAttribute(name);
        if (value === null) {
          return null;
        }
        if (value === "" && BOOLEAN_ATTRS.has(name)) {
          return "true";
        }
        if (REFERENCE_ATTRS.has(name)) {
          const referenced = root.querySelector<HTMLElement>(`[id="${value}"]`);
          return referenced?.dataset["part"] === undefined ? value : targetOf(referenced);
        }
        return value;
      },
      visible: () =>
        options.hideableParts.flatMap((name) =>
          partsOf(name)
            .filter((element) => element.checkVisibility())
            .map(targetOf),
        ),
      events: (name) => mounted.events.get(canonical(name)) ?? [],
      ...(mounted.value === undefined ? {} : { value: mounted.value }),
    },
    dispose: mounted.dispose,
  };
};
