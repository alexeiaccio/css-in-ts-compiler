// Every style of the app, as plain OpenTUI props: each export is a function of the theme (and of a row's state) that
// returns the `style` object of one element. Passed as `style={...}`, the object is reapplied when the theme changes; an
// object sets every key it may have changed (the binding writes the keys it gets and never clears the others). When
// cssints' TUI target lands (cssints-m0yj), this module is the one to rewrite.
import type { BoxOptions, MousePointerStyle, TextOptions } from "@opentui/core";
import { useRenderer } from "@opentui/solid";
import { createSignal } from "solid-js";

const palettes = {
  dark: {
    bg: "#101316",
    card: "#171b20",
    hover: "#222831",
    text: "#e6e9ec",
    muted: "#8b98a5",
    border: "#323a44",
    accent: "#3b9cf0",
    link: "#5cb0ff",
    onAccent: "#ffffff",
  },
  light: {
    bg: "#f3f5f7",
    card: "#ffffff",
    hover: "#e8eef4",
    text: "#0f1419",
    muted: "#56636f",
    border: "#cfd8df",
    accent: "#1170cf",
    link: "#0b62bd",
    onAccent: "#ffffff",
  },
};
export type Mode = keyof typeof palettes;
export const [mode, setMode] = createSignal<Mode>("dark");
export const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));
const c = () => palettes[mode()];

type Box = Partial<BoxOptions>;
type Text = Partial<TextOptions>;
// A span takes colours and attributes only.
interface Span {
  fg?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
}

export interface RowState {
  selected: boolean;
  hovered: boolean;
}

export const screen = (): Box => ({
  flexDirection: "column",
  width: "100%",
  height: "100%",
  backgroundColor: c().bg,
});
export const bar = (): Box => ({
  flexDirection: "row",
  flexShrink: 0,
  gap: 2,
  paddingX: 1,
  backgroundColor: c().card,
});
export const tab = (s: RowState & { active: boolean }): Text => ({
  fg: s.active ? c().onAccent : s.hovered ? c().text : c().muted,
  bg: s.active ? c().accent : s.hovered ? c().hover : c().card,
});
export const title = (): Span => ({ fg: c().accent, bold: true });
export const list = (): Box => ({ flexGrow: 1, backgroundColor: c().bg });
export const footer = (): Text => ({ fg: c().muted, bg: c().card, flexShrink: 0, paddingX: 1 });

// A post card: the selected one has the accent border, the one under the pointer a lighter background.
export const card = (s: RowState, depth = 0): Box => ({
  flexDirection: "column",
  flexShrink: 0,
  border: true,
  borderStyle: "rounded",
  borderColor: s.selected ? c().accent : c().border,
  backgroundColor: s.hovered ? c().hover : c().card,
  paddingX: 1,
  marginLeft: Math.min(depth, 6) * 2,
});
export const quote = (): Box => ({
  flexDirection: "column",
  border: true,
  borderStyle: "single",
  borderColor: c().border,
  paddingX: 1,
});
export const body = (): Text => ({ fg: c().text, wrapMode: "word" });
export const muted = (): Text => ({ fg: c().muted, wrapMode: "word" });
export const name = (): Span => ({ fg: c().text, bold: true });
export const meta = (): Span => ({ fg: c().muted });
export const link = (): Span => ({ fg: c().link, underline: true });
export const tag = (): Span => ({ fg: c().link });
export const num = (): Span => ({ fg: c().text, bold: true });
export const placeholder = (): Text => ({ fg: c().muted });

// Hover for a clickable element: a signal for its style, the pointer cursor while it is under the mouse.
// `over` and `out` bubble from the children, and moving onto a child sends `out` then `over`: the last one wins.
export function hoverable() {
  const renderer = useRenderer();
  const [hovered, setHovered] = createSignal(false);
  const pointer = (on: boolean, style: MousePointerStyle) => () => {
    setHovered(on);
    renderer.setMousePointer(style);
  };
  return { hovered, over: pointer(true, "pointer"), out: pointer(false, "default") } as const;
}
