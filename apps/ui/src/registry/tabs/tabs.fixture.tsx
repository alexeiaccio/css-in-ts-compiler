import { type Tabs as TabsController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { TabsConfig } from "@cssints/apg-specs/apg/tabs.bridge";
import { Tabs } from "./tabs.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const disabledIndices = (mask: number): ReadonlyArray<number> =>
  [0, 1, 2, 3].filter((index) => ((mask >> index) & 1) === 1);

/**
 * Mounts the styled tabs for the scenario walk. Panel 0 holds the focusable content the ported
 * panel-tabindex scenarios expect. Controlled, the fixture is the host: it keeps the selection in
 * a signal, passes it as `value`, and either writes every request back (`accepts`) or ignores the
 * callback.
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
  let api: TabsController | undefined;

  const dispose = render(() => {
    return (
      <Tabs
        items={config.items}
        value={config.controlled ? host() : undefined}
        defaultSelected={config.selected}
        orientation={config.orientation}
        activation={config.activation}
        disabled={disabledIndices(config.disabled)}
        focusablePanels={[0]}
        onReady={(controller) => {
          api = controller;
        }}
        onValueChange={(index) => {
          events.set("onSelectionChange", [
            ...(events.get("onSelectionChange") ?? []),
            `tab:${index}`,
          ]);
          if (config.accepts) {
            setHost(index);
          }
        }}
        tab={(index) => `Tab ${index + 1}`}
        panel={(index) => (index === 0 ? <input data-part="input" /> : undefined)}
      />
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
