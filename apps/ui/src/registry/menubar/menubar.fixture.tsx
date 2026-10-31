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

  const dispose = render(
    () => (
      <Menubar
        items={tree}
        orientation={config.orientation}
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
          api?.keyDown(record["key"]);
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
