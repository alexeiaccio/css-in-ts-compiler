import { createSignal } from "solid-js";

// The colour mode is a class on <html> (none is "system": theme.ts follows prefers-color-scheme); index.html sets it before the
// first paint from what is stored here.
export type Mode = "system" | "light" | "dark";
export const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const KEY = "cssints-docs.mode";
const root = document.documentElement;

const [mode, setMode] = createSignal<Mode>(
  root.classList.contains("light") ? "light" : root.classList.contains("dark") ? "dark" : "system",
);
export { mode };

export function cycle() {
  const to = next[mode()];
  root.classList.remove("light", "dark");
  if (to !== "system") root.classList.add(to);
  try {
    if (to === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, to);
  } catch {}
  setMode(to);
}
