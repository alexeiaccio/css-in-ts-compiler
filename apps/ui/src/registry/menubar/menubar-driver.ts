import { type ActionStep, type Driver, type Json, Unsupported } from "@cssints/apg-specs/scenario";
import { userEvent } from "vite-plus/test/browser";

/**
 * The DOM side of the menubar bridge. Unlike the generic `domDriver`, a target is the spec's own label
 * (`menuitem:0`, `menuitem:0/1/0`, `menu:0`, `submenu:1`), because the bar nests its parts; this maps each label onto the
 * kit's `data-part` names. `Mounted` is the contract a fixture returns.
 */
export interface Mounted {
  readonly root: HTMLElement;
  /** Apply a scenario `prop` step (programmatic input) to the mounted widget. */
  readonly setProp: (name: string, value: Json | undefined) => void;
  /** Callback payloads, recorded under their canonical name. */
  readonly events: ReadonlyMap<string, ReadonlyArray<Json>>;
  readonly value?: () => Json;
  /** The part the primitive itself considers focused (`menuitem:0`), or `null`. */
  readonly focus?: () => string | null;
  readonly dispose: () => void;
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
    .map((modifier) => `/{${modifier}}`)
    .join("")}`;
};

const partsOf = (root: HTMLElement, name: string): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`),
];

const childrenOf = (element: HTMLElement): HTMLElement[] =>
  [...element.children].filter((child): child is HTMLElement => child instanceof HTMLElement);

const submenuOf = (row: HTMLElement | undefined): HTMLElement | undefined =>
  row?.querySelector<HTMLElement>('[data-part="menubar-submenu"]') ?? undefined;

const at = <T>(list: readonly T[], index: number): T | undefined => list[index];

/** The spec's target labels, mapped onto the kit's parts: the triggers, each menu, then each submenu. */
const elementOf = (root: HTMLElement, target: string): HTMLElement => {
  const missing = (): never => {
    throw new Unsupported(`part ${target}`);
  };
  if (target === "menubar") {
    return at(partsOf(root, "menubar"), 0) ?? missing();
  }
  if (target.startsWith("menu:")) {
    return at(partsOf(root, "menubar-menu"), Number(target.slice("menu:".length))) ?? missing();
  }
  if (target.startsWith("submenu:")) {
    const index = Number(target.slice("submenu:".length));
    const menus = partsOf(root, "menubar-menu");
    const rows = menus.flatMap((menu) => childrenOf(menu));
    const submenus = rows.flatMap((row) => submenuOf(row) ?? []);
    return at(submenus, index - 1) ?? missing();
  }
  if (!target.startsWith("menuitem:")) {
    return missing();
  }
  const path = target
    .slice("menuitem:".length)
    .split("/")
    .map((part) => Number(part));
  const [bar, item, sub] = path;
  if (bar === undefined || !Number.isInteger(bar)) {
    return missing();
  }
  if (item === undefined) {
    return at(partsOf(root, "menubar-trigger"), bar) ?? missing();
  }
  const row = at(childrenOf(at(partsOf(root, "menubar-menu"), bar) ?? missing()), item);
  if (sub === undefined) {
    return row ?? missing();
  }
  return at(childrenOf(submenuOf(row) ?? missing()), sub) ?? missing();
};

export const menubarDriver = (mounted: Mounted): Driver => {
  const { root } = mounted;

  const activePart = (): string | null => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active)) {
      return null;
    }
    return active.dataset["part"] ?? null;
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "focus":
          if (step.target === undefined || step.target === "menubar") {
            mounted.setProp("focus", undefined);
          } else {
            elementOf(root, step.target).focus();
          }
          break;
        case "blur": {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          } else if (step.target !== undefined) {
            elementOf(root, step.target).blur();
          }
          break;
        }
        case "click":
          // dispatch without native pointer focus: the widget owns roving focus
          elementOf(root, step.target ?? "").dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
          break;
        case "hover":
          await userEvent.hover(elementOf(root, step.target ?? ""));
          break;
        case "unhover":
          await userEvent.unhover(elementOf(root, step.target ?? ""));
          break;
        case "key": {
          // dispatch to whatever currently holds focus inside the widget, exactly like a user
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
      focus: () => (mounted.focus === undefined ? activePart() : mounted.focus()),
      attr: (target, name) => {
        if (name.startsWith("data-")) {
          throw new Unsupported(`styling hook ${name}`);
        }
        const value = elementOf(root, target).getAttribute(name);
        if (value === null) {
          return null;
        }
        if (value === "" && BOOLEAN_ATTRS.has(name)) {
          return "true";
        }
        return value;
      },
      visible: () => [
        ...partsOf(root, "menubar-menu").flatMap((menu, bar) =>
          menu.checkVisibility() ? [`menu:${bar}`] : [],
        ),
        ...partsOf(root, "menubar-submenu").flatMap((submenu, index) =>
          submenu.checkVisibility() ? [`submenu:${index + 1}`] : [],
        ),
      ],
      events: (name) => mounted.events.get(name) ?? [],
      ...(mounted.value === undefined ? {} : { value: mounted.value }),
    },
    dispose: mounted.dispose,
  };
};
