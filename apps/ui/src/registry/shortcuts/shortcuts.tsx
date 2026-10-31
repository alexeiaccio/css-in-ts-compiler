import { createHotkeys, type Hotkeys } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createSignal, For, onSettled } from "solid-js";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "../dialog/dialog.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** One row of the sheet: the chord the page bound, and what it does. */
export interface ShortcutItem {
  /** A chord of `createHotkeys`: `"mod+k"`, `"/"`, `"escape"`. The caps split it on `+`. */
  readonly keys: string;
  /** What the chord does, in the host's words. */
  readonly label: string;
}

/** A named block of rows: "General", "Editing", "Navigation". */
export interface ShortcutGroup {
  readonly group: string;
  readonly items: ReadonlyArray<ShortcutItem>;
}

export interface KbdProps {
  /** One key (`"?"`, `"escape"`) or a chord (`"mod+k"`): a `+` is a separator between caps. */
  readonly keys: string;
  /** `mod` and `meta` as ⌘, and nothing else changes: the host passes what it gave `createShortcuts`. */
  readonly isApple?: boolean | undefined;
  readonly class?: string | undefined;
}

export interface ShortcutsProps {
  /** The groups to render, in order. The sheet lists them; it never binds anything. */
  readonly groups: ReadonlyArray<ShortcutGroup>;
  /** The dialog's accessible name, and its visible title. @default "Keyboard shortcuts" */
  readonly label?: string | undefined;
  /** `mod` and `meta` as ⌘; the same value the registry got. */
  readonly isApple?: boolean | undefined;
  /** Controlled: the host owns the open state. */
  readonly open?: boolean | undefined;
  /** Open at mount; ignored while `open` is set. */
  readonly defaultOpen?: boolean | undefined;
  /** A request to open or close: the close control, Escape and the backdrop all ask the host. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /** The element the sheet is portalled into (default `document.body`). */
  readonly mount?: Element | undefined;
  readonly class?: string | undefined;
}

export interface CreateShortcutsOptions {
  /** Whether `mod` is Cmd; injected so a test does not read the runner's OS. */
  readonly isApple?: boolean | undefined;
  /**
   * Only events from inside this element open the sheet, read once the host has settled (so a ref is set). Omit it to
   * open from anywhere on the page.
   */
  readonly scope?: (() => HTMLElement | undefined) | undefined;
  /** Open at mount. @default false */
  readonly defaultOpen?: boolean | undefined;
  /** The open state changed, whatever asked for it. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface ShortcutsController {
  readonly open: () => boolean;
  /** Opens or closes the sheet; a page can also do it from a button. */
  readonly setOpen: (open: boolean) => void;
  /** The registry the host adds its own chords to: `shortcuts.hotkeys.bind({ keys: "s", onTrigger })`. */
  readonly hotkeys: Hotkeys;
  /** Unbinds every chord, this starter's `?` included. A page calls it when it unmounts. */
  readonly dispose: () => void;
}

// The detection `createHotkeys` uses for a chord's `mod`, repeated here because the caps are a skin: a page passes both
// the registry and the sheet the same value, and the default is the platform they would have picked anyway.
const detectsApple = (): boolean =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

const NAMED_KEYS: Readonly<Record<string, string>> = {
  escape: "Esc",
  enter: "Enter",
  tab: "Tab",
  space: "Space",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
};

/** One cap's text: the named keys are short, `mod` is the platform's, and a letter is upper case. */
const capText = (key: string, isApple: boolean): string => {
  if (key === "mod" || key === "meta") {
    return isApple ? "⌘" : "Ctrl";
  }
  const named = NAMED_KEYS[key];
  if (named !== undefined) {
    return named;
  }
  return key.length === 1 ? key.toUpperCase() : key;
};

const caps = (keys: string, isApple: boolean): ReadonlyArray<string> =>
  keys
    .split("+")
    .filter((key) => key !== "")
    .map((key) => capText(key.toLowerCase(), isApple));

const kbdClass = css.cn(css.display("inline-flex"), css.alignItems("center"), css.gap(t.space._1));

// A cap is a small bordered box, the width of its own text with a floor so a single character reads as a key.
const capClass = css.cn(
  css.boxSizing("border-box"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.minWidth(t.space._6),
  css.height(t.space._6),
  css.paddingInline(t.space._1),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.buttonBackground),
  css.color(t.color.text),
  css.fontFamily("monospace"),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.lineHeight(1),
  css.whiteSpace("nowrap"),
);

const separatorClass = css.cn(
  css.color(t.color.muted),
  css.fontSize(t.font.sizeSm),
  css.lineHeight(1),
);

const headerClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._3),
);

const groupsClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._5));

const groupClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));

const groupTitleClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("600"),
  css.color(t.color.muted),
  css.textTransform("uppercase"),
  css.letterSpacing("0.04em"),
);

const listClass = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space._2),
  css.margin("0"),
);

const rowClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space._4),
);

const termClass = css.cn(css.fontSize(t.font.size), css.color(t.color.text));

// `dd` has an inline margin by default; the row's gap is the only spacing between the label and the keys.
const definitionClass = css.cn(css.margin("0"));

/**
 * A key cap for one key or one chord: `keys` is split on `+`, each part is a cap, and the separators between them are
 * visible. A multi-cap chord is a named group (`aria-label="Ctrl+K"`), so a screen reader reads one shortcut rather than
 * a row of unrelated letters; a single cap needs no name of its own.
 */
export const Kbd = (props: KbdProps): JSX.Element => {
  const labels = (): ReadonlyArray<string> => caps(props.keys, props.isApple ?? detectsApple());
  return (
    <span
      data-part="kbd"
      class={css.cn(kbdClass, props.class)}
      role={labels().length > 1 ? "group" : undefined}
      aria-label={labels().length > 1 ? labels().join("+") : undefined}
    >
      <For each={labels()}>
        {(label, index) => (
          <>
            {index() > 0 ? (
              <span data-part="kbd-separator" aria-hidden="true" class={separatorClass}>
                +
              </span>
            ) : null}
            <kbd data-part="kbd-cap" class={capClass}>
              {label}
            </kbd>
          </>
        )}
      </For>
    </span>
  );
};

/**
 * The shortcuts sheet: a trigger-less modal dialog over the kit's `Dialog`, one row per chord, and a close control.
 * `Dialog` owns the ARIA, the focus into the panel and back, Escape, the backdrop and the page's scroll lock; this skin
 * adds the caps, the groups and the header. It renders the chords the host passes and binds none of them: what fires is
 * the host's registry (`createShortcuts`), so a page can list a chord it bound elsewhere or leave one out.
 */
export const Shortcuts = (props: ShortcutsProps): JSX.Element => {
  const label = (): string => props.label ?? "Keyboard shortcuts";
  return (
    <Dialog
      label={label()}
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      mount={props.mount}
    >
      <DialogContent class={props.class}>
        <div data-part="shortcuts-header" class={headerClass}>
          <DialogTitle>{label()}</DialogTitle>
          <DialogClose>Close</DialogClose>
        </div>
        <div data-part="shortcuts-groups" class={groupsClass}>
          <For each={props.groups}>
            {(group) => (
              <section data-part="shortcuts-group" class={groupClass}>
                <h3 data-part="shortcuts-group-title" class={groupTitleClass}>
                  {group.group}
                </h3>
                <dl data-part="shortcuts-list" class={listClass}>
                  <For each={group.items}>
                    {(item) => (
                      <div data-part="shortcuts-row" class={rowClass}>
                        <dt data-part="shortcuts-label" class={termClass}>
                          {item.label}
                        </dt>
                        <dd data-part="shortcuts-keys" class={definitionClass}>
                          <Kbd keys={item.keys} isApple={props.isApple} />
                        </dd>
                      </div>
                    )}
                  </For>
                </dl>
              </section>
            )}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * The wiring: a `createHotkeys` registry whose `"?"` opens the sheet, plus the open state the sheet reads. **The host
 * owns the registry**: add the chords of the page to `controller.hotkeys` (`bind({ keys: "mod+k", onTrigger })`), pass
 * the same list to `Shortcuts` when the sheet should list them, and call `dispose` on unmount. `?` is bound with
 * `allowInEditable: false`, so typing a question mark in a field stays typing, and with `scope` when the page wants the
 * sheet only from inside one region; the sheet itself only renders.
 *
 * The binding is added when the component settles, so a `scope` that reads a ref has the element; `dispose` is run for
 * the host on cleanup, and the returned `dispose` does the same when a host without a component scope ends.
 */
export const createShortcuts = (options: CreateShortcutsOptions = {}): ShortcutsController => {
  const hotkeys = createHotkeys({ isApple: options.isApple });
  const [open, setOpenSignal] = createSignal(options.defaultOpen ?? false);

  const setOpen = (next: boolean): void => {
    if (open() === next) {
      return;
    }
    setOpenSignal(next);
    options.onOpenChange?.(next);
  };

  onSettled(() => {
    const unbind = hotkeys.bind({
      keys: "?",
      allowInEditable: false,
      scope: options.scope?.(),
      onTrigger: () => setOpen(true),
    });
    return () => {
      unbind();
      hotkeys.dispose();
    };
  });

  return {
    open,
    setOpen,
    hotkeys,
    dispose: () => hotkeys.dispose(),
  };
};
