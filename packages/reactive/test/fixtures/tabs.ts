// A string state and set(), on an owner whose initial value is true: the tabs of README.md.
import { cn, display } from "cssints" with { type: "cssints" };
import { bind, inside, on, set, state } from "@cssints/reactive" with { type: "cssints" };

const tabs = state({ tab: "two", open: true });

export const list = cn(tabs.owner, display("flex"));
export const first = cn(on({ click: set(tabs.tab, "one") }), bind({ "aria-current": tabs.tab }));
export const second = cn(on({ click: set(tabs.tab, "two") }));
export const one = inside(tabs.tab, "one")(display("block"));
export const two = inside(tabs.tab, "two")(display("block"));
