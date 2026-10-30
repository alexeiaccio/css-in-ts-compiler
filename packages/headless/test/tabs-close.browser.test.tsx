import { For, Show, createEffect, createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import { tabsConfig } from "@cssints/apg-specs/apg/tabs.bridge";
import { type Tabs, createTabs } from "../src/tabs";
import { mountTabs } from "./tabs.fixture";

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

interface Files {
  readonly root: HTMLDivElement;
  readonly tabs: Tabs;
  readonly names: () => ReadonlyArray<string>;
  readonly closes: ReadonlyArray<number>;
  readonly renames: ReadonlyArray<readonly [number, string]>;
  readonly tab: (index: number) => HTMLElement;
  readonly close: (index: number) => HTMLButtonElement;
  readonly input: () => HTMLInputElement | null;
  readonly dispose: () => void;
}

const tabElements = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="tab"]'),
];

/**
 * The docs playground's file tabs: a host that owns the list and asks
 * `createTabs` for close and rename. The primitive never removes or renames
 * anything; `onClose` / `onRename` are the requests this fixture accepts.
 *
 * The tab is a `role=tab` `<div>` because the inline rename input cannot live
 * inside a `<button>` (interactive content); the close button is its sibling.
 */
const mountFiles = (initial: ReadonlyArray<string>): Files => {
  const root = document.createElement("div");
  document.body.append(root);
  const [files, setFiles] = createSignal<ReadonlyArray<string>>([...initial]);
  const closes: number[] = [];
  const renames: Array<readonly [number, string]> = [];
  let api: Tabs | undefined;

  const dispose = render(() => {
    const tabs = createTabs({
      get items() {
        return files().length;
      },
      get closable() {
        return true;
      },
      get renamable() {
        return true;
      },
      label: (index) => files()[index],
      onClose: (index) => {
        closes.push(index);
        setFiles((current) => current.filter((_, at) => at !== index));
      },
      onRename: (index, label) => {
        renames.push([index, label]);
        setFiles((current) => current.map((name, at) => (at === index ? label : name)));
      },
    });
    api = tabs;

    // The host's focus effect: the primitive only holds the intent, the host
    // moves DOM focus. It also reads the count, so closing the first tab (whose
    // neighbour keeps its index) still refocuses the tab that took its place.
    createEffect(
      () => [tabs.focused(), files().length] as const,
      ([index]) => {
        const element = tabElements(root)[index];
        if (index >= 0 && element !== undefined && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    // A rename starts with the field focused; the host renders the input, so
    // this effect runs after the flush that created it.
    createEffect(
      () => tabs.editing(),
      (index) => {
        if (index === null) {
          return;
        }
        const input = root.querySelector<HTMLInputElement>('[data-part="rename"]');
        if (input !== null && document.activeElement !== input) {
          input.focus();
        }
      },
    );

    return (
      <div>
        <div data-part="tablist" {...tabs.tablistProps}>
          <For each={files()}>
            {(name, at) => (
              <span>
                <div
                  data-part="tab"
                  {...tabs.tabProps(at())}
                  onDblClick={tabs.renameProps(at()).onDblClick}
                >
                  <Show
                    when={tabs.renameProps(at()).editing()}
                    fallback={<span data-part="label">{name}</span>}
                  >
                    <input data-part="rename" {...tabs.renameProps(at()).inputProps} />
                  </Show>
                </div>
                <button data-part="close" {...tabs.closeProps(at())}>
                  ×
                </button>
              </span>
            )}
          </For>
        </div>
        <For each={files()}>
          {(_, at) => <div data-part="tabpanel" {...tabs.tabpanelProps(at())} />}
        </For>
      </div>
    );
  }, root);

  return {
    root,
    get tabs() {
      return api as Tabs;
    },
    names: files,
    closes,
    renames,
    tab: (index) => {
      const element = tabElements(root)[index];
      if (element === undefined) {
        throw new Error(`no tab ${index}`);
      }
      return element;
    },
    close: (index) => {
      const element = root.querySelectorAll<HTMLButtonElement>('[data-part="close"]')[index];
      if (element === undefined) {
        throw new Error(`no close button ${index}`);
      }
      return element;
    },
    input: () => root.querySelector<HTMLInputElement>('[data-part="rename"]'),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

const writable = (): Files => mountFiles(["a.ts", "b.ts", "c.ts"]);

describe("createTabs close (real DOM)", () => {
  it("keeps the close buttons out of the tablist's tab order", async () => {
    const mounted = writable();
    try {
      expect(mounted.close(0).tabIndex).toBe(-1);
      expect(mounted.close(1).getAttribute("aria-label")).toBe("Close b.ts");

      await userEvent.click(mounted.tab(0));
      await userEvent.tab();
      await settle();
      // a tablist's stops are its tabs: the close button is skipped for the panel
      expect(document.activeElement?.getAttribute("data-part")).not.toBe("close");
      expect(document.activeElement?.getAttribute("role")).toBe("tabpanel");
    } finally {
      mounted.dispose();
    }
  });

  it("closes the focused tab with Delete and focuses the tab that took its place", async () => {
    const mounted = writable();
    try {
      await userEvent.click(mounted.tab(1));
      await userEvent.keyboard("{Delete}");
      await settle();

      expect(mounted.closes).toEqual([1]);
      expect(mounted.names()).toEqual(["a.ts", "c.ts"]);
      expect(mounted.tab(1).textContent).toBe("c.ts");
      expect(document.activeElement).toBe(mounted.tab(1));
      // the deleted selected tab hands selection to the tab that took the focus
      expect(mounted.tab(1).getAttribute("aria-selected")).toBe("true");
    } finally {
      mounted.dispose();
    }
  });

  it("focuses the previous tab when the last one closes", async () => {
    const mounted = writable();
    try {
      await userEvent.click(mounted.tab(2));
      await userEvent.keyboard("{Delete}");
      await settle();

      expect(mounted.names()).toEqual(["a.ts", "b.ts"]);
      expect(document.activeElement).toBe(mounted.tab(1));
      expect(mounted.tab(1).getAttribute("aria-selected")).toBe("true");
    } finally {
      mounted.dispose();
    }
  });

  it("closes from the button and refocuses the tab that slid into the first slot", async () => {
    const mounted = writable();
    try {
      await userEvent.click(mounted.tab(0));
      await userEvent.click(mounted.close(0));
      await settle();

      expect(mounted.closes).toEqual([0]);
      expect(mounted.names()).toEqual(["b.ts", "c.ts"]);
      expect(document.activeElement).toBe(mounted.tab(0));
      expect(mounted.tab(0).textContent).toBe("b.ts");
    } finally {
      mounted.dispose();
    }
  });

  it("refuses to close the last remaining tab", async () => {
    const mounted = mountFiles(["only.ts"]);
    try {
      await userEvent.click(mounted.tab(0));
      await userEvent.keyboard("{Delete}");
      await settle();

      expect(mounted.closes).toEqual([]);
      expect(mounted.names()).toEqual(["only.ts"]);
    } finally {
      mounted.dispose();
    }
  });
});

describe("createTabs rename (real DOM)", () => {
  it("starts on a double click and commits on Enter", async () => {
    const mounted = writable();
    try {
      await userEvent.dblClick(mounted.tab(0));
      await settle();
      const input = mounted.input();
      expect(input).not.toBeNull();
      expect(input?.value).toBe("a.ts");
      expect(document.activeElement).toBe(input);

      await userEvent.clear(input as HTMLInputElement);
      await userEvent.type(input as HTMLInputElement, "renamed.ts");
      await userEvent.keyboard("{Enter}");
      await settle();

      expect(mounted.renames).toEqual([[0, "renamed.ts"]]);
      expect(mounted.names()).toEqual(["renamed.ts", "b.ts", "c.ts"]);
      expect(mounted.tab(0).textContent).toBe("renamed.ts");
      expect(mounted.input()).toBeNull();
      expect(mounted.close(0).getAttribute("aria-label")).toBe("Close renamed.ts");
    } finally {
      mounted.dispose();
    }
  });

  it("reverts on Escape", async () => {
    const mounted = writable();
    try {
      await userEvent.dblClick(mounted.tab(0));
      await settle();
      await userEvent.clear(mounted.input() as HTMLInputElement);
      await userEvent.type(mounted.input() as HTMLInputElement, "nope.ts");
      await userEvent.keyboard("{Escape}");
      await settle();

      expect(mounted.renames).toEqual([]);
      expect(mounted.names()).toEqual(["a.ts", "b.ts", "c.ts"]);
      expect(mounted.tab(0).textContent).toBe("a.ts");
      expect(mounted.input()).toBeNull();
    } finally {
      mounted.dispose();
    }
  });

  it("commits on blur", async () => {
    const mounted = writable();
    try {
      await userEvent.dblClick(mounted.tab(1));
      await settle();
      await userEvent.clear(mounted.input() as HTMLInputElement);
      await userEvent.type(mounted.input() as HTMLInputElement, "blurred.ts");
      await userEvent.tab();
      await settle();

      expect(mounted.renames).toEqual([[1, "blurred.ts"]]);
      expect(mounted.names()).toEqual(["a.ts", "blurred.ts", "c.ts"]);
      expect(mounted.input()).toBeNull();
    } finally {
      mounted.dispose();
    }
  });

  it("ignores arrows while editing and moves again after the field is gone", async () => {
    const mounted = writable();
    try {
      await userEvent.click(mounted.tab(0));
      await userEvent.dblClick(mounted.tab(0));
      await settle();
      expect(mounted.tabs.focused()).toBe(0);

      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(mounted.tabs.focused()).toBe(0);
      expect(mounted.tabs.selected()).toBe(0);
      expect(mounted.tab(0).getAttribute("aria-selected")).toBe("true");

      await userEvent.keyboard("{Escape}");
      await settle();
      await userEvent.click(mounted.tab(0));
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(mounted.tabs.selected()).toBe(1);
      expect(document.activeElement).toBe(mounted.tab(1));
    } finally {
      mounted.dispose();
    }
  });
});

describe("createTabs (plain, no close or rename)", () => {
  it("still walks the tablist and ignores Delete", async () => {
    const mounted = mountTabs(tabsConfig({ items: 3 }));
    try {
      const tab = (index: number): HTMLElement => {
        const element = tabElements(mounted.root)[index];
        if (element === undefined) {
          throw new Error(`no tab ${index}`);
        }
        return element;
      };
      tab(0).focus();
      await userEvent.keyboard("{ArrowRight}");
      await settle();
      expect(tab(1).getAttribute("aria-selected")).toBe("true");
      expect(document.activeElement).toBe(tab(1));

      await userEvent.keyboard("{Delete}");
      await settle();
      expect(tabElements(mounted.root)).toHaveLength(3);
      expect(tab(1).getAttribute("aria-selected")).toBe("true");
    } finally {
      mounted.dispose();
    }
  });
});
