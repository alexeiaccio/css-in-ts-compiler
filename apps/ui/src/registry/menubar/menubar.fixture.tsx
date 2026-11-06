import { type Menubar as MenubarController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { MenuMenubarConfig } from "@cssints/apg-specs/apg/menu-menubar.bridge";
import type { Mounted } from "./menubar-driver.ts";
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from "./menubar.tsx";
import { render } from "@solidjs/web";

const asRecord = (value: Json | undefined): Record<string, Json> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return value as Record<string, Json>;
};

/**
 * The walk's `key` steps are programmatic and its probe reads the rendered `tabindex`: they become a real keydown
 * where the user's finger is, and the fixture runs the kit on the forced polyfill, because the native engine
 * ignores an untrusted `keydown` and writes no tabindex (`packages/headless`'s `menu.browser.test.tsx` covers
 * that path).
 */
const pressKey = (target: HTMLElement | undefined, key: string): void => {
  target?.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: key === "Space" ? " " : key,
      bubbles: true,
      cancelable: true,
    }),
  );
};

/**
 * Renders the kit's menubar with the `menu-menubar.qnt` fixed tree: the first bar item's menu has three items with a
 * submenu on the second, the second bar item has a menu of two, the third none.
 */
export const mountMenubar = (config: MenuMenubarConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  let api: MenubarController | undefined;

  const labels = config.items;
  const tree = [
    {
      label: labels[0] ?? "File",
      menu: [
        { label: "New" },
        { label: "More", submenu: [{ label: "One" }, { label: "Two" }] },
        { label: "Close" },
      ],
    },
    {
      label: labels[1] ?? "Edit",
      menu: [{ label: "Undo" }, { label: "Redo" }],
    },
    { label: labels[2] ?? "About" },
  ];

  const partsOf = (name: string): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`),
  ];
  const childrenOf = (element: HTMLElement | undefined): HTMLElement[] =>
    element === undefined
      ? []
      : [...element.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
  /** The row the primitive reports as focused, in the kit's own parts. */
  const focusedElement = (): HTMLElement | undefined => {
    const level = api?.focusLevel();
    if (level === 1) {
      return partsOf("menubar-trigger")[api?.barStop() ?? 0];
    }
    if (level === 2) {
      return childrenOf(partsOf("menubar-menu")[api?.openTop() ?? 0])[api?.focusIndex() ?? 0];
    }
    if (level === 3) {
      const parent = childrenOf(partsOf("menubar-menu")[api?.openTop() ?? 0])[api?.openSub() ?? 0];
      const submenu =
        parent?.querySelector<HTMLElement>('[data-part="menubar-submenu"]') ?? undefined;
      return childrenOf(submenu)[api?.focusIndex() ?? 0];
    }
    return undefined;
  };

  const dispose = render(
    () => (
      <Menubar
        items={tree}
        orientation={config.orientation}
        provider="polyfill"
        onReady={(menubar) => {
          api = menubar;
        }}
      >
        <MenubarMenu index={0}>
          <MenubarTrigger />
          <MenubarContent />
        </MenubarMenu>
        <MenubarMenu index={1}>
          <MenubarTrigger />
          <MenubarContent />
        </MenubarMenu>
        <MenubarMenu index={2}>
          <MenubarTrigger />
        </MenubarMenu>
      </Menubar>
    ),
    root,
  );

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "focus":
          api?.focusIn();
          break;
        case "leave":
        case "blur":
          api?.leave();
          break;
        case "key": {
          const record = asRecord(value);
          if (typeof record["key"] !== "string") {
            throw new Error(`key needs a string, got ${JSON.stringify(value)}`);
          }
          pressKey(focusedElement(), record["key"]);
          break;
        }
        case "typeahead":
          api?.typeaheadCode(Number(value));
          break;
        case "type":
          api?.type(String(value));
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    focus: () => {
      const level = api?.focusLevel();
      if (level === 1) {
        return `menuitem:${api?.barStop()}`;
      }
      if (level === 2) {
        return `menuitem:${api?.openTop()}/${api?.focusIndex()}`;
      }
      if (level === 3) {
        return `menuitem:${api?.openTop()}/${api?.openSub()}/${api?.focusIndex()}`;
      }
      return null;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

/** The bar the kit's own DOM assertions drive: one menu with a submenu, one without, and a bar item that has no menu. */
export const mountBar = (): { readonly root: HTMLElement; readonly dispose: () => void } => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(
    () => (
      <Menubar
        items={[
          {
            label: "File",
            menu: [
              { label: "New" },
              { label: "Export", submenu: [{ label: "PDF" }, { label: "PNG" }] },
              { label: "Close" },
            ],
          },
          { label: "Edit", menu: [{ label: "Undo" }, { label: "Redo" }] },
          { label: "Help" },
        ]}
      />
    ),
    root,
  );
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
