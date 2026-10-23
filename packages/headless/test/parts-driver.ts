import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import { userEvent } from "vite-plus/test/browser";

/**
 * The DOM side of the grid/treegrid bridges. Unlike `domDriver`, targets are the
 * full `data-part` labels (`cell:0,0`, `row:0/expander`), so indexed parts like
 * grid cells can be addressed without a name:index convention. `Mounted` is the
 * same contract `domDriver` consumes.
 */
export interface PartsDriverOptions {
  /** Parts that can be hidden: the ones `expect.visible` lists. */
  readonly hideableParts?: ReadonlyArray<string>;
  readonly eventName?: (name: string) => string;
}

const BOOLEAN_ATTRS = new Set(["hidden", "disabled"]);

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

const NAMED_KEYS = new Set([
  "Enter",
  "Tab",
  "Escape",
  "Backspace",
  "Delete",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

const keyToken = (key: string): string => {
  if (key === " " || key === "Space") {
    return " ";
  }
  return NAMED_KEYS.has(key) || /^F\d+$/.test(key) || key.startsWith("Arrow") ? `{${key}}` : key;
};

const keyboardSyntax = (key: string): string => {
  if (!key.includes("+")) {
    return keyToken(key);
  }
  const parts = key.split("+");
  const main = parts.pop() ?? "";
  return `${parts.map((modifier) => `{${modifier}>}`).join("")}${keyToken(main)}${parts
    .map((modifier) => `{/${modifier}}`)
    .join("")}`;
};

export const partsDriver = (mounted: Mounted, options: PartsDriverOptions = {}): Driver => {
  const { root } = mounted;
  const canonical = options.eventName ?? ((name: string) => name);

  const elementOf = (target: string): HTMLElement => {
    const element = [...root.querySelectorAll<HTMLElement>("[data-part]")].find(
      (candidate) => candidate.dataset["part"] === target,
    );
    if (element === undefined) {
      throw new Unsupported(`part ${target}`);
    }
    return element;
  };

  const activePart = (): string | null => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active)) {
      return null;
    }
    const part = active.closest<HTMLElement>("[data-part]")?.dataset["part"];
    if (part === undefined) {
      return null;
    }
    return part.replace(/\/widget$/, "");
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "focus":
          if (step.target === undefined || step.target === "grid") {
            mounted.setProp("focus", undefined);
          } else {
            elementOf(step.target).focus();
          }
          break;
        case "blur": {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          } else if (step.target !== undefined) {
            elementOf(step.target).blur();
          }
          break;
        }
        case "click":
          // dispatch without native pointer focus: the widget owns roving focus
          elementOf(step.target ?? "").dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
          break;
        case "hover":
          await userEvent.hover(elementOf(step.target ?? ""));
          break;
        case "unhover":
          await userEvent.unhover(elementOf(step.target ?? ""));
          break;
        case "key": {
          // dispatch to whatever currently holds focus inside the widget, exactly
          // like a user; with focus outside the grid the key is a no-op, matching
          // the spec's hasFocus gate (and avoiding native Tab focus changes)
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            await userEvent.keyboard(keyboardSyntax(step.key ?? ""));
          }
          break;
        }
        case "prop":
          mounted.setProp(step.prop ?? "", step.value);
          break;
        default:
          throw new Unsupported(`event ${step.event}`);
      }
      await settle();
    },
    observer: {
      focus: () => mounted.focus?.() ?? activePart(),
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
        return value;
      },
      visible: () =>
        (options.hideableParts ?? []).flatMap((name) =>
          [...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)].flatMap((element) =>
            element.checkVisibility() ? [element.dataset["part"] ?? name] : [],
          ),
        ),
      events: (name) => mounted.events.get(canonical(name)) ?? [],
      ...(mounted.value === undefined ? {} : { value: mounted.value }),
    },
    dispose: mounted.dispose,
  };
};
