import { preeval } from "./preeval.mjs";

// Eval-time stand-in. wyw hoists args like `() => css.items("center")` into thunks and runs them
// against this module without applying the inner processor, so the runtime must compute the same value.
export const css = new Proxy({}, { get: (_, member) => (...args) => preeval([String(member), args]) });
export const cx = (...a) => a.filter(Boolean).join(" ");
