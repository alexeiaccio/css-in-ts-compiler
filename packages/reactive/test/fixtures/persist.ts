// Persistence: a persisted boolean and a persisted string, from two state() calls on one element (the protocol lists join),
// and a state without persist() (never stored).
import { cn, display } from "cssints" with { type: "cssints" };
import { persist, state, when } from "@cssints/reactive" with { type: "cssints" };

const ui = state({ open: persist(false, "demo-open") });
const tabs = state({ tab: persist("one", "demo-tab"), count: 0 });

export const owner = cn(ui.owner, tabs.owner);
export const panel = when(ui.open)(display("block"));
