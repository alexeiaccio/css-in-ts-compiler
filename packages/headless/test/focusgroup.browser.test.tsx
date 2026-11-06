import {
  type FocusGroupDefinition,
  type FocusGroupHandle,
  focusGroup,
  focusGroupAttribute,
  focusGroupPolyfill,
  supportsFocusGroup,
} from "../src/focusgroup";
import { userEvent } from "vite-plus/test/browser";
import { afterEach, describe, expect, it } from "vite-plus/test";

/**
 * The adapter alone, on plain markup, with both providers: the native attribute
 * (this Chromium) and the forced polyfill in the same run. Everything a widget
 * adds on top (roles, activation, embedded controls) is the widget's test.
 *
 * Measured platform facts this pins: the native engine writes no `tabindex`
 * (the tab stop is the focus controller's, so only focus shows it), the polyfill
 * renders it as `tabindex="0"` / `"-1"` and marks each decorated item with
 * `data-fg-ati`, and the polyfill ignores untrusted `keydown` only insofar as it
 * handles them exactly like real ones.
 */

const HANDLED: FocusGroupHandle[] = [];
const ROOTS: HTMLElement[] = [];

afterEach(() => {
  for (const handle of HANDLED.splice(0)) {
    handle.destroy();
  }
  for (const root of ROOTS.splice(0)) {
    root.remove();
  }
});

const DEFINITION: FocusGroupDefinition = {
  behavior: "toolbar",
  wrap: false,
  axis: "inline",
  memory: true,
};

interface Fixture {
  readonly before: HTMLButtonElement;
  readonly after: HTMLButtonElement;
  readonly owner: HTMLElement;
  readonly items: HTMLElement[];
  /** Append an item the collection will read on the next `update()`. */
  add(label: string): HTMLElement;
}

type Attach = (owner: HTMLElement, options: Parameters<typeof focusGroup>[1]) => FocusGroupHandle;

const mount = (
  attach: Attach,
  definition: FocusGroupDefinition = DEFINITION,
  authors: ReadonlyArray<string | null> = [],
): Fixture => {
  const root = document.createElement("div");
  const before = document.createElement("button");
  before.textContent = "before";
  const after = document.createElement("button");
  after.textContent = "after";
  const owner = document.createElement("div");
  owner.setAttribute("role", "toolbar");
  owner.setAttribute("focusgroup", "toolbar");
  for (const [index, label] of ["a", "b", "c"].entries()) {
    const item = document.createElement("button");
    item.textContent = label;
    const author = authors[index] ?? null;
    if (author !== null) {
      item.setAttribute("tabindex", author);
    }
    owner.append(item);
  }
  root.append(before, owner, after);
  document.body.append(root);
  ROOTS.push(root);
  HANDLED.push(attach(owner, { definition, items: () => [...owner.children] as HTMLElement[] }));
  return {
    before,
    after,
    owner,
    items: [...owner.children] as HTMLElement[],
    add: (label) => {
      const item = document.createElement("button");
      item.textContent = label;
      owner.append(item);
      return item;
    },
  };
};

const active = (): Element | null => document.activeElement;

const tabStops = (fixture: Fixture): number =>
  fixture.items.filter((item) => item.getAttribute("tabindex") === "0").length;

const PROVIDERS: ReadonlyArray<readonly [string, Attach, boolean]> = [
  ["native", focusGroup, true],
  ["polyfill", focusGroupPolyfill, false],
];

describe("focusgroup adapter", () => {
  it("derives the attribute from the definition", () => {
    expect(focusGroupAttribute({ behavior: "toolbar" })).toBe("toolbar");
    expect(focusGroupAttribute({ behavior: "toolbar", axis: "block", wrap: false })).toBe(
      "toolbar block nowrap",
    );
    expect(focusGroupAttribute({ behavior: "tablist", wrap: true })).toBe("tablist wrap");
    expect(focusGroupAttribute({ behavior: "menu", memory: false })).toBe("menu nomemory");
  });

  for (const [provider, attach, native] of PROVIDERS) {
    describe(provider, () => {
      it.skipIf(native && !supportsFocusGroup())(
        "is exactly one tab stop: Tab enters the group, and leaves it",
        async () => {
          const fixture = mount(attach);
          fixture.before.focus();
          await userEvent.tab();
          expect(active()).toBe(fixture.items[0]);
          await userEvent.tab();
          expect(active()).toBe(fixture.after);
        },
      );

      it.skipIf(native && !supportsFocusGroup())(
        "moves along the inline axis, Home and End, and stops where the wrap says",
        async () => {
          const fixture = mount(attach);
          const oneTabStop = (): void => {
            if (!native) {
              expect(tabStops(fixture)).toBe(1);
            }
          };
          fixture.items[0]?.focus();
          await userEvent.keyboard("{ArrowRight}");
          expect(active()).toBe(fixture.items[1]);
          oneTabStop();
          await userEvent.keyboard("{ArrowRight}");
          await userEvent.keyboard("{ArrowRight}");
          expect(active()).toBe(fixture.items[2]);
          oneTabStop();
          await userEvent.keyboard("{ArrowLeft}");
          expect(active()).toBe(fixture.items[1]);
          oneTabStop();
          await userEvent.keyboard("{Home}");
          expect(active()).toBe(fixture.items[0]);
          await userEvent.keyboard("{End}");
          expect(active()).toBe(fixture.items[2]);
          oneTabStop();
        },
      );

      it.skipIf(native && !supportsFocusGroup())(
        "wraps only when the definition says so",
        async () => {
          const wrapped = mount(attach, { ...DEFINITION, wrap: true });
          wrapped.items[2]?.focus();
          await userEvent.keyboard("{ArrowRight}");
          expect(active()).toBe(wrapped.items[0]);
        },
      );

      it.skipIf(native && !supportsFocusGroup())(
        "leaves the perpendicular axis free on a block group",
        async () => {
          const fixture = mount(attach, { ...DEFINITION, axis: "block" });
          fixture.items[0]?.focus();
          await userEvent.keyboard("{ArrowDown}");
          expect(active()).toBe(fixture.items[1]);
          await userEvent.keyboard("{ArrowRight}");
          expect(active()).toBe(fixture.items[1]);
          await userEvent.keyboard("{ArrowUp}");
          expect(active()).toBe(fixture.items[0]);
        },
      );

      it.skipIf(native && !supportsFocusGroup())(
        "re-enters on the remembered item after Tab",
        async () => {
          const fixture = mount(attach);
          fixture.items[1]?.focus();
          await userEvent.tab();
          expect(active()).toBe(fixture.after);
          await userEvent.tab({ shift: true });
          expect(active()).toBe(fixture.items[1]);
        },
      );

      it.skipIf(native && !supportsFocusGroup())(
        "re-reconciles an item set that changed under the group",
        async () => {
          const fixture = mount(attach);
          const added = fixture.add("d");
          fixture.items.push(added);
          HANDLED.at(-1)?.update();
          fixture.items[0]?.focus();
          await userEvent.keyboard("{End}");
          expect(active()).toBe(added);
          if (!native) {
            expect(tabStops(fixture)).toBe(1);
          }
          // and one leaving: the group ends before it
          fixture.items[2]?.remove();
          fixture.items.splice(2, 1);
          HANDLED.at(-1)?.update();
          fixture.items.at(-1)?.focus();
          await userEvent.keyboard("{Home}");
          expect(active()).toBe(fixture.items[0]);
          await userEvent.keyboard("{End}");
          expect(active()).toBe(added);
          if (!native) {
            expect(tabStops(fixture)).toBe(1);
          }
        },
      );

      it.skipIf(native && !supportsFocusGroup())(
        "restores the authors' tabindex values on destroy, idempotently",
        async () => {
          const fixture = mount(attach, DEFINITION, ["2", null, "-1"]);
          const handle = HANDLED.at(-1);
          expect(handle).toBeDefined();
          if (!native) {
            // the polyfill rendered the tab stop over the authors' values
            expect(fixture.items[0]?.getAttribute("tabindex")).toBe("0");
            expect(fixture.items[2]?.getAttribute("tabindex")).toBe("-1");
          }
          handle?.destroy();
          handle?.destroy();
          handle?.update();
          expect(fixture.items[0]?.getAttribute("tabindex")).toBe("2");
          expect(fixture.items[1]?.hasAttribute("tabindex")).toBe(false);
          expect(fixture.items[2]?.getAttribute("tabindex")).toBe("-1");
        },
      );
    });
  }

  it.skipIf(!supportsFocusGroup())(
    "native: only the attribute, no tabindex and no polyfill marker",
    () => {
      const fixture = mount(focusGroup);
      expect(fixture.owner.getAttribute("focusgroup")).toBe("toolbar inline nowrap");
      for (const item of fixture.items) {
        expect(item.hasAttribute("tabindex")).toBe(false);
        expect(item.hasAttribute("data-fg-ati")).toBe(false);
      }
    },
  );

  it("polyfill: keeps the native engine out of the group", () => {
    const fixture = mount(focusGroupPolyfill);
    expect(fixture.owner.hasAttribute("focusgroup")).toBe(false);
    expect(tabStops(fixture)).toBe(1);
    for (const item of fixture.items) {
      expect(item.hasAttribute("data-fg-ati")).toBe(true);
    }
  });
});
