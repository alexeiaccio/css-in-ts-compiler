import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal, onSettled, untrack } from "solid-js";

import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import {
  createShortcuts,
  Kbd,
  Shortcuts,
  type ShortcutGroup,
  type ShortcutsController,
} from "./shortcuts.tsx";

/** The chords the sheet lists: the host binds them, the sheet only renders what it is given. */
export const SHORTCUT_GROUPS: ReadonlyArray<ShortcutGroup> = [
  {
    group: "General",
    items: [
      { keys: "?", label: "Open this sheet" },
      { keys: "escape", label: "Close it" },
    ],
  },
  {
    group: "Editing",
    items: [
      { keys: "mod+k", label: "Focus the search field" },
      { keys: "s", label: "Toggle the saved marker" },
    ],
  },
];

const muted = (): JSX.CSSProperties => ({ margin: "0", "font-size": "13px", color: "#555" });

export interface ShortcutsExampleProps {
  /** Injected for a test: ⌘ or Ctrl in the caps and in the registry. */
  readonly isApple?: boolean | undefined;
  /** The controller, once: the test disposes the registry the way a page's unmount does. */
  readonly onReady?: ((controller: ShortcutsController) => void) | undefined;
}

/**
 * The starter in ordinary use: a button that opens the sheet, `?` that opens it from the page, and two real bindings the
 * page owns — `mod+k` scoped to the demo box to focus the field, and `s` page-wide to toggle the saved marker. The note
 * has an `s` of its own over the page's, which is what `scope` does: inside it the note saves, outside it the page toggles.
 */
export const ShortcutsExample = (props: ShortcutsExampleProps): JSX.Element => {
  const shortcuts = createShortcuts({ isApple: props.isApple });
  untrack(() => props.onReady)?.(shortcuts);

  const [saved, setSaved] = createSignal(false);
  const [log, setLog] = createSignal("Nothing yet: press ? for the sheet, or s in the box.");
  let box: HTMLDivElement | undefined;
  let note: HTMLDivElement | undefined;
  let search: HTMLInputElement | undefined;

  onSettled(() => {
    const unbinds = [
      shortcuts.hotkeys.bind({
        keys: "mod+k",
        scope: box,
        onTrigger: () => search?.focus(),
      }),
      shortcuts.hotkeys.bind({
        keys: "s",
        onTrigger: () => {
          setSaved((value) => !value);
          setLog("The page's s toggled the saved marker.");
        },
      }),
      // bound last, so inside the note this one wins; outside it the scope does not match and the page's s runs
      shortcuts.hotkeys.bind({
        keys: "s",
        scope: note,
        onTrigger: () => setLog("The note's own s saved it, and the page's s did not fire."),
      }),
    ];
    return () => {
      for (const unbind of unbinds) {
        unbind();
      }
    };
  });

  return (
    <div
      data-part="shortcuts-demo"
      ref={(element: HTMLDivElement) => {
        box = element;
      }}
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "12px",
        width: "36rem",
        "max-width": "100%",
      }}
    >
      <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
        <Button onClick={() => shortcuts.setOpen(true)}>Keyboard shortcuts</Button>
        <Input
          aria-label="Search"
          placeholder="Search"
          style={{ width: "16rem" }}
          ref={(element: HTMLInputElement) => {
            search = element;
          }}
        />
      </div>
      <p style={muted()}>
        Press <Kbd keys="?" /> anywhere on the page, or <Kbd keys="mod+k" isApple={props.isApple} />{" "}
        inside this box to focus the field.
      </p>
      <div
        data-part="shortcuts-note"
        ref={(element: HTMLDivElement) => {
          note = element;
        }}
        style={{
          display: "flex",
          gap: "8px",
          "align-items": "center",
          "justify-content": "space-between",
          padding: "12px",
          border: "1px solid #e0e0e0",
          "border-radius": "8px",
        }}
      >
        <p style={muted()}>
          The note has its own <Kbd keys="s" />, so <Kbd keys="s" /> here saves the note.
        </p>
        <Button tone="quiet" size="sm">
          Save note
        </Button>
      </div>
      <div style={{ display: "flex", gap: "16px", "align-items": "center" }}>
        <p data-part="shortcuts-saved" style={muted()}>
          Saved: {saved() ? "yes" : "no"}
        </p>
        <p data-part="shortcuts-log" style={muted()}>
          {log()}
        </p>
      </div>
      <Shortcuts
        open={shortcuts.open()}
        onOpenChange={shortcuts.setOpen}
        groups={SHORTCUT_GROUPS}
        isApple={props.isApple}
      />
    </div>
  );
};

/** What a mounted demo hands the test: where it lives, its sheet, and two teardowns. */
export interface MountedShortcuts {
  readonly root: HTMLElement;
  /** The open sheet, or `undefined` while it is closed (the dialog puts nothing in the DOM then). */
  readonly sheet: () => HTMLElement | undefined;
  /** Ends the demo's registry the way a page's unmount does: every chord stops firing. */
  readonly disposeShortcuts: () => void;
  readonly dispose: () => void;
}

/**
 * Mounts the starter in ordinary use, with the platform injected so a test never reads the runner's OS. The sheet is
 * portalled into `document.body`, so it is found from there rather than from `root`.
 */
export const mountShortcuts = (options: { readonly isApple?: boolean } = {}): MountedShortcuts => {
  const root = document.createElement("div");
  document.body.append(root);
  let controller: ShortcutsController | undefined;

  const sheet = (): HTMLElement | undefined =>
    [...document.querySelectorAll<HTMLElement>('[data-part="dialog"]')].find(
      (element) => element.getAttribute("aria-label") === "Keyboard shortcuts",
    );

  const dispose = render(
    () => (
      <ShortcutsExample
        isApple={options.isApple}
        onReady={(ready) => {
          controller = ready;
        }}
      />
    ),
    root,
  );

  return {
    root,
    sheet,
    disposeShortcuts: () => {
      if (controller === undefined) {
        throw new Error("shortcuts fixture: the controller was not ready");
      }
      controller.dispose();
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
