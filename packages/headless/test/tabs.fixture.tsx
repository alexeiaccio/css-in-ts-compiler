import { type Tabs, createTabs } from "../src/tabs";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { TabsConfig } from "@cssints/apg-specs/src/apg/tabs.bridge";
import { render } from "@solidjs/web";

const disabledIndices = (mask: number): ReadonlyArray<number> =>
  [0, 1, 2, 3].filter((index) => ((mask >> index) & 1) === 1);

/**
 * Renders `createTabs` as a tablist, tabs and panels (each part carrying
 * `data-part`) and exposes the `Mounted` the DOM driver needs. DOM focus is
 * synced to the primitive's `focused` tab so the driver observes `tab:N`; panel
 * 0 contains the focusable content the ported panel-tabindex scenarios expect.
 *
 * Controlled, the fixture is the host: it keeps the selection in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback.
 */
export const mountTabs = (config: TabsConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.pinned ?? config.selected);
  const writeHost = (next: number): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Tabs | undefined;

  const tabElements = (): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>('[data-part="tab"]'),
  ];

  const dispose = render(() => {
    const tabs = createTabs({
      items: config.items,
      get value() {
        return config.controlled ? host() : undefined;
      },
      defaultSelected: config.selected,
      orientation: config.orientation,
      activation: config.activation,
      disabled: disabledIndices(config.disabled),
      focusablePanels: [0],
      onValueChange: (index) => {
        events.set("onSelectionChange", [
          ...(events.get("onSelectionChange") ?? []),
          `tab:${index}`,
        ]);
        if (config.accepts) {
          setHost(index);
        }
      },
    });
    api = tabs;
    createEffect(
      () => tabs.focused(),
      (index) => {
        const element = tabElements()[index];
        if (index >= 0 && element !== undefined) {
          if (document.activeElement !== element) {
            element.focus();
          }
        }
      },
    );
    return (
      <div>
        <div data-part="tablist" {...tabs.tablistProps}>
          {Array.from({ length: config.items }, (_, index) => (
            <button data-part="tab" {...tabs.tabProps(index)}>
              Tab {index + 1}
            </button>
          ))}
        </div>
        {Array.from({ length: config.items }, (_, index) => (
          <div data-part="tabpanel" {...tabs.tabpanelProps(index)}>
            {index === 0 ? <input data-part="input" /> : null}
          </div>
        ))}
      </div>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "selectedKey":
        case "selected":
          api?.setSelected(Number(value));
          break;
        case "setValue":
          writeHost(Number(value));
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
