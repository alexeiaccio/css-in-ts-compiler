/**
 * Hotkeys: one registry for the chords every app hand-rolls (the docs app's `/`
 * and Cmd/Ctrl+K, the CMS's Cmd/Ctrl+S), instead of a `keydown` listener per
 * screen.
 *
 * This is a platform utility, not a widget: there is no APG pattern for a
 * keyboard registry, so no role, no element, no styling, no Quint spec and no
 * ported scenario. The oracle is `test/hotkeys.browser.test.tsx` in a real
 * Chromium.
 */

export interface HotkeyBinding {
  /**
   * A chord: the modifiers `mod` (Cmd on macOS, Ctrl elsewhere), `ctrl`, `alt`,
   * `shift`, `meta`, then exactly one key (`k`, `/`, `?`, `escape`, `enter`,
   * `arrowup`), joined with `+`; `"mod+k"`, `"shift+?"`, `"/"`.
   */
  readonly keys: string;
  readonly onTrigger: (event: KeyboardEvent) => void;
  /** Gates a binding whose precondition is off: it falls through to the next one. */
  readonly when?: (() => boolean) | undefined;
  /** `event.preventDefault()` when the binding fires; default true. */
  readonly preventDefault?: boolean | undefined;
  /** Fire while the focus is in an input, a textarea or a contenteditable; default false. */
  readonly allowInEditable?: boolean | undefined;
  /** Only events from inside this element: one panel's `"mod+s"` over a page's. */
  readonly scope?: HTMLElement | undefined;
}

export interface HotkeysOptions {
  /** Whether `mod` is Cmd; injected so a test does not read the runner's OS. */
  readonly isApple?: boolean | undefined;
}

export interface Hotkeys {
  /** Registers `binding`; the returned unbind is idempotent. The last bound wins. */
  readonly bind: (binding: HotkeyBinding) => () => void;
  /** Unbinds all of them and removes the listener; a later `bind` is a no-op. */
  readonly dispose: () => void;
}

interface Chord {
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly key: string;
}

interface Entry {
  readonly chord: Chord;
  readonly binding: HotkeyBinding;
}

const MODIFIERS = new Set(["mod", "ctrl", "alt", "shift", "meta"]);

// Characters a US layout produces with Shift held, so `"?"` implies Shift even
// when the binding does not spell `"shift+?"` out. Everything else is exact.
const SHIFTED = new Set('~!@#$%^&*()_+{}|:"<>?');

const detectsApple = (): boolean =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

const parse = (keys: string, isApple: boolean): Chord => {
  const parts = keys.toLowerCase().split("+");
  const key = parts.pop() ?? "";
  if (key === "" || MODIFIERS.has(key)) {
    throw new TypeError(`hotkeys: "${keys}" ends with no key`);
  }
  const chord = { ctrl: false, meta: false, alt: false, shift: SHIFTED.has(key), key };
  for (const part of parts) {
    switch (part) {
      case "mod":
        if (isApple) {
          chord.meta = true;
        } else {
          chord.ctrl = true;
        }
        break;
      case "ctrl":
        chord.ctrl = true;
        break;
      case "meta":
        chord.meta = true;
        break;
      case "alt":
        chord.alt = true;
        break;
      case "shift":
        chord.shift = true;
        break;
      default:
        throw new TypeError(`hotkeys: "${part}" in "${keys}" is not a modifier`);
    }
  }
  return chord;
};

const matches = (chord: Chord, event: KeyboardEvent): boolean =>
  event.key.toLowerCase() === chord.key &&
  event.ctrlKey === chord.ctrl &&
  event.metaKey === chord.meta &&
  event.altKey === chord.alt &&
  event.shiftKey === chord.shift;

const editable = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

const inScope = (scope: HTMLElement | undefined, target: EventTarget | null): boolean =>
  scope === undefined || (target instanceof Node && scope.contains(target));

/**
 * One `keydown` listener in the capture phase, one list of chords. A chord
 * fires when its modifiers match exactly, its `when` holds, its scope contains
 * the event's target, and the focus is not in a text field (unless
 * `allowInEditable`). The most recently bound match is the only one that fires,
 * so a modal's `"/"` overrides the page's and unbinding it brings the page's
 * back; `preventDefault` is on by default for the bindings whose chord the
 * browser would otherwise act on (Cmd/Ctrl+S, Cmd/Ctrl+K).
 */
export const createHotkeys = (options: HotkeysOptions = {}): Hotkeys => {
  const isApple = options.isApple ?? detectsApple();
  const bindings: Entry[] = [];
  let listening = false;
  let disposed = false;

  const onKeyDown = (event: KeyboardEvent): void => {
    for (let i = bindings.length - 1; i >= 0; i--) {
      const entry = bindings[i];
      if (entry === undefined) {
        continue;
      }
      const { chord, binding } = entry;
      if (!matches(chord, event) || binding.when?.() === false) {
        continue;
      }
      if (!inScope(binding.scope, event.target)) {
        continue;
      }
      if (binding.allowInEditable !== true && editable(event.target)) {
        continue;
      }
      if (binding.preventDefault !== false) {
        event.preventDefault();
      }
      binding.onTrigger(event);
      return;
    }
  };

  const stop = (): void => {
    if (!listening) {
      return;
    }
    listening = false;
    document.removeEventListener("keydown", onKeyDown, true);
  };

  return {
    bind: (binding) => {
      if (disposed) {
        return () => {};
      }
      const entry: Entry = { chord: parse(binding.keys, isApple), binding };
      bindings.push(entry);
      if (!listening) {
        listening = true;
        document.addEventListener("keydown", onKeyDown, true);
      }
      return () => {
        const at = bindings.indexOf(entry);
        if (at === -1) {
          return;
        }
        bindings.splice(at, 1);
        if (bindings.length === 0) {
          stop();
        }
      };
    },
    dispose: () => {
      disposed = true;
      bindings.length = 0;
      stop();
    },
  };
};
