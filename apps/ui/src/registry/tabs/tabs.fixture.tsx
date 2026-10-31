import { type Tabs as TabsController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { JSX } from "@solidjs/web";
import type { Mounted } from "./tabs-driver.ts";
import type { TabsConfig } from "@cssints/apg-specs/apg/tabs.bridge";
import { Tabs } from "./tabs.tsx";
import { createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";

import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

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

export interface SkinMounted {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

export interface SkinOptions {
  /** The tab labels; the default is `Tab 1` … `Tab 4`. */
  readonly label?: (index: number) => JSX.Element;
}

/**
 * The styled tabs alone: the skin's own requirements (target size, focus, reflow) are about what it
 * renders, not about the primitive's selection, so these mounts skip the scenario driver.
 */
export const mountSkin = (options: SkinOptions = {}): SkinMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(
    () => (
      <Tabs
        items={4}
        defaultSelected={0}
        tab={(index) => options.label?.(index) ?? `Tab ${index + 1}`}
      />
    ),
    root,
  );
  flush();
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const scrollClass = css.cn(css.height("8rem"), css.overflow("auto"), css.position("relative"));
const headerClass = css.cn(
  css.position("sticky"),
  css.top(0),
  css.zIndex("1"),
  css.height(t.space._8),
  css.bg(t.color.surface),
);
const spacerClass = css.height(t.space._10);
const tallPanelClass = css.height("24rem");

/**
 * A sticky header over a tablist: the composition 2.4.12 is about. The panel is tall so the scroll
 * container can put the tablist at its top, where the header would cover a focused tab without the
 * skin's `scroll-margin-top`.
 */
export const mountTabsUnderStickyHeader = (): SkinMounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(
    () => (
      <div class={scrollClass} data-part="scroll">
        <div class={headerClass} data-part="sticky-header">
          Section
        </div>
        <div class={spacerClass} />
        <Tabs
          items={4}
          defaultSelected={0}
          tab={(index) => `Tab ${index + 1}`}
          panel={() => <div class={tallPanelClass} />}
        />
      </div>
    ),
    root,
  );
  flush();
  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
