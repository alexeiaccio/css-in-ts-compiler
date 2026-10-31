// emit(): the one hand-off to JavaScript — a program segment beside toggle and set, on a form's submit. It writes no
// state: the event leaves the DOM from the target, already carrying the nearest owner.
import { cn, display } from "cssints" with { type: "cssints" };

import { emit, inside, on, state, toggle } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ open: false });

// the form is the owner, and its submit hands the event to the app
export const form = cn(ui.owner, on({ submit: emit("save") }));
// one program: a hand-off and a write, in the order they were written
export const saveAndOpen = cn(on({ submit: [emit("save"), toggle(ui.open)] }));
export const panel = inside(ui.open)(display("block"));
