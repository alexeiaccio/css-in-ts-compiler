// The DOM's text above the canvas: the input method the field's characters come from, and the clipboard's chords.
//
// A canvas is no editable element, so it is dispatched no beforeinput, no input and no composition. Chromium's
// `EditContext` is the standard's answer (`canvas.editContext = new EditContext()`), and a browser without it — WebKit —
// gets a hidden textarea instead (`?ime=input` forces that path, which is how the check drives both). The composition's
// committed string goes to `Input.textInput`, the call main.ts makes for SDL's TEXTINPUT, and only while a text field has
// the focus (`textInput` answers false for anything else). The desktop has no composition at all: SDL delivers committed
// characters, so here the IME's intermediate text is kept in a buffer and never inserted — `compositionend` commits the
// string it ended with, one insertion, and until then the page's model, its commands and its pixels are untouched (the
// candidate window is the browser's; a canvas gets no inline preview).
//
// The clipboard is the same Input's: copy and cut read the selection the field already has (`Input.clipboard`), paste
// inserts what the clipboard holds through `Input.textInput`, and select-all is the field's own Home then Shift+End, so no
// second selection model is invented here. A read is a promise, so a paste changes nothing until it settles and then runs
// one frame: while the permission is pending the canvas shows the field as it was.
import type { Input } from "../../solid/src/input.ts";

/** Chromium's EditContext, the part this page uses (TypeScript 5.9's lib.dom has no declaration for it). */
interface EditContext extends EventTarget {
  readonly text: string;
}

export interface Text {
  /** A composition is in progress: its keydowns are the IME's, not characters of the page's. */
  composing(): boolean;
}

/**
 * The field's text path: the composition surface, and the four clipboard chords. `frame` is one frame on an edit (the
 * shell's `immediate`), so a committed string, a paste and a cut are drawn at once, as a key is.
 */
export function attachText(canvas: HTMLCanvasElement, input: Input, frame: () => void): Text {
  const forced = new URLSearchParams(location.search).get("ime");
  const Edit = (globalThis as { EditContext?: new () => EditContext }).EditContext;
  const useEditContext = forced !== "input" && Edit !== undefined;
  // the composition as the IME presents it: held only so a `compositionend` that carries no data still commits the
  // string it showed
  let presented = "";
  let composing = false;

  /** The committed string to the focused field, and its frame; false (and no frame) when no text field has the focus. */
  const commit = (text: string): void => {
    composing = false;
    presented = "";
    if (text !== "" && input.textInput(text)) frame();
  };

  if (useEditContext) {
    const context = new (Edit as new () => EditContext)();
    context.addEventListener("compositionstart", () => {
      composing = true;
      presented = "";
    });
    // the IME's draft, whole: Chromium gives the composition's new string with the range it replaces
    context.addEventListener("textupdate", (event) => {
      const text = (event as Event & { readonly text?: string }).text;
      if (composing && text !== undefined) presented = text;
    });
    context.addEventListener("compositionend", (event) => commit((event as CompositionEvent).data ?? presented));
    (canvas as HTMLCanvasElement & { editContext?: EditContext }).editContext = context;
  } else {
    // the fallback: an editable element the browser will attach its IME to, off the page's pixels. It keeps no text of
    // its own — a plain character is cancelled in `beforeinput`, the keydown having taken it already — and it holds the
    // DOM's focus while the page is the field's: a keydown on it is cloned onto the canvas (where the shell's key
    // listener and this page's are), and a key the page consumed is `preventDefault`ed on the real event too, so the
    // browser neither moves the focus on Tab nor scrolls on Space or an arrow
    const hidden = document.createElement("textarea");
    hidden.setAttribute("aria-hidden", "true");
    hidden.tabIndex = -1;
    hidden.style.cssText =
      "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;border:0;padding:0;margin:0;resize:none;z-index:-1";
    document.body.append(hidden);
    const forward = (event: KeyboardEvent): void => {
      const clone = new KeyboardEvent(event.type, {
        key: event.key,
        code: event.code,
        repeat: event.repeat,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      });
      canvas.dispatchEvent(clone);
      if (clone.defaultPrevented) event.preventDefault();
    };
    hidden.addEventListener("keydown", forward);
    hidden.addEventListener("keyup", forward);
    hidden.addEventListener("compositionstart", () => {
      composing = true;
      presented = "";
    });
    hidden.addEventListener("compositionupdate", (event) => {
      presented = event.data ?? "";
    });
    hidden.addEventListener("compositionend", (event) => {
      hidden.value = "";
      commit(event.data ?? presented);
    });
    hidden.addEventListener("beforeinput", (event) => {
      if (composing) return;
      event.preventDefault();
      hidden.value = "";
    });
    // a press keeps the canvas the page's, but the DOM's focus goes to the IME's element after it: the browser's own
    // focus on mousedown is cancelled, so the canvas's `focus()` in the shell does not take it back
    canvas.addEventListener("mousedown", (event) => {
      event.preventDefault();
      hidden.focus();
    });
  }

  // Cmd/Ctrl+C, X, V and A on a focused text field: the page's own clipboard (`Input.clipboard`), the field's own
  // selection, and `Input.textInput` for a paste. A chord on a page with no text field focused — or in a context with no
  // `navigator.clipboard` — is the browser's, as `keyName` decides for the desktop's keys.
  const fieldFocused = (): boolean => input.clipboard("paste", "") !== undefined;
  canvas.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key !== "a" && key !== "c" && key !== "x" && key !== "v") return;
    const clipboard: Clipboard | undefined = navigator.clipboard;
    if (clipboard === undefined || !fieldFocused()) return;
    event.preventDefault();
    if (key === "a") {
      input.down("Home");
      input.down("Shift+End");
      frame();
      return;
    }
    if (key === "v") {
      // the permission is a promise: the field is untouched until it settles, and then one frame shows the insert
      void clipboard.readText().then(
        (text) => {
          if (input.textInput(text)) frame();
        },
        () => {},
      );
      return;
    }
    // copy and cut are the field's: `cut` is its own copy and the backspace rule over the selection, as main.ts's chord
    const text = input.clipboard(key === "c" ? "copy" : "cut", "");
    if (text === null) return;
    if (key === "x") frame();
    void clipboard.writeText(text).catch(() => {});
  });

  return { composing: () => composing };
}
