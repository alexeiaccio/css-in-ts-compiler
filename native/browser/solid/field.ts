// The Text field page in the browser: the desktop's app/Field.tsx unmodified (the neutral `createTextField` of
// headless/, its caret and its selection drawn as runs of text and 1px boxes), with its own createInput() on
// browser/solid/shell.ts — the loop, the pointer, the keys and window.__page as on the other pages.
//
// Typing is the DOM's, and it is the one thing a canvas cannot do for itself: it is no editable element, so there is no
// beforeinput, no input and no composition — the printable characters come from the keydown's `key`, which is the string
// SDL's TEXTINPUT gives (`Input.textInput(text)`, the call the desktop's text events make), and the keys the focus
// manager's table drops stay keys.ts's (Tab, Shift+Tab, Backspace, Delete, the arrows, Home/End, Enter, Escape). Shift
// with Left, Right, Home or End is a selection chord, which `keyName` refuses as a move (`selectionChord`), and the page
// draws the selection it makes.
import "./globals.ts";

import { Field, size } from "../../solid/app/Field.tsx";
import { createInput } from "../../solid/src/input.ts";
import { selectionChord } from "./keys.ts";
import { mountPage } from "./shell.ts";

const input = createInput();
// one frame on the event, as a press and a key have: the shell's own
let frame = () => {};

await mountPage({
  width: size.width,
  height: size.height,
  input,
  tree: (setup) => {
    frame = setup.immediate;
    return () => Field({ input, motion: setup.motion });
  },
});

const canvas = document.getElementById("frame") as HTMLCanvasElement;

// The typed text, beside the shell's key listener: the two do not overlap — `keyName` drops a selection chord and takes
// no character, and a printable key is a letter, a digit or a mark, not one of the keys it names. Cmd, Ctrl and Alt
// chords are the browser's (as `keyName` decides), and an IME has no path here: a canvas is not editable, so no
// composition event is ever dispatched to it and `Input.textInput` gets characters, not a composition's phases.
// A character and a selection chord are `preventDefault`ed, as the shell's consumed keys are: the canvas is the focused
// element, and a typed character must not reach a browser accelerator (Chrome's type-to-find) while it is the page's.
canvas.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const chord = selectionChord(event);
  if (chord !== undefined) {
    event.preventDefault();
    input.down(chord);
    frame();
    return;
  }
  // one code point of `key` (a surrogate pair is one character), and only from a key that is a character: "ArrowLeft",
  // "Tab" and the like are the shell's
  if ([...event.key].length !== 1) return;
  event.preventDefault();
  input.textInput(event.key);
  frame();
});
