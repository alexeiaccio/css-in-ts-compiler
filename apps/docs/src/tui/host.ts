// The page as the terminal's other end: what a terminal emulator does around its screen, for an app that runs in the page.
// ghostty-web draws the bytes and turns keys into input; this adds what it leaves out. The app's colour queries (OSC 10,
// 11 and 4, CSI ? 996 n) are answered from the site's display settings, and with mode 2031 on, a change of the settings
// is reported (CSI ? 997 ; 1|2 n), so the app asks again. The mouse is reported as SGR (modes 1003 and 1006), and OSC 22
// sets the pointer over the canvas.
import type { ITheme, Terminal } from "ghostty-web";

/** The terminal's colours, `#rrggbb`: the default foreground and background and the 16 ANSI colours. */
export interface Palette {
  fg: string;
  bg: string;
  ansi: string[];
}

const SLOTS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;
// the slots the site has no colour for (VS Code's terminal defaults)
const DEFAULTS = [
  "",
  "",
  "#0dbc79",
  "#e5e510",
  "",
  "#bc3fbc",
  "#11a8cd",
  "",
  "",
  "",
  "#23d18b",
  "#f5f543",
  "",
  "#d670d6",
  "#29b8db",
  "",
];

// A colour of the page as #rrggbb, whatever its notation: a canvas pixel painted with it.
const pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
const hexOf = (colour: string) => {
  pixel.clearRect(0, 0, 1, 1);
  pixel.fillStyle = "#000";
  pixel.fillStyle = colour;
  pixel.fillRect(0, 0, 1, 1);
  const [r, g, b] = pixel.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => v!.toString(16).padStart(2, "0")).join("")}`;
};

/**
 * The terminal palette of the site's display settings: the colour tokens on `<html>` (palette, hue and mode).
 *
 * @returns {Palette} the colours a terminal would report
 */
export const pagePalette = (): Palette => {
  const cs = getComputedStyle(document.documentElement);
  const token = (name: string) => hexOf(cs.getPropertyValue(`--color-${name}`).trim());
  const site: Record<number, string> = {
    0: token("bg-muted"),
    1: token("error"),
    4: token("accent"),
    7: token("text-medium"),
    8: token("text-low"),
    9: token("error"),
    12: token("link"),
    15: token("text"),
  };
  return {
    fg: token("text"),
    bg: token("bg"),
    ansi: DEFAULTS.map((d, i) => site[i] ?? d),
  };
};

/**
 * Calls `fn` when the display settings change: the classes and data attributes of `<html>`, and the system's colour scheme.
 *
 * @param {Function} fn called after a change
 * @returns {Function} stops it
 */
export const watchSettings = (fn: () => void): (() => void) => {
  const observer = new MutationObserver(fn);
  observer.observe(document.documentElement, { attributes: true });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", fn);
  return () => {
    observer.disconnect();
    scheme.removeEventListener("change", fn);
  };
};

/**
 * ghostty-web's theme for a palette.
 *
 * @param {Palette} p the palette
 * @returns {ITheme} the theme
 */
export const themeOf = (p: Palette): ITheme => ({
  foreground: p.fg,
  background: p.bg,
  cursor: p.fg,
  ...Object.fromEntries(SLOTS.map((s, i) => [s, p.ansi[i]])),
});

const luminance = (hex: string) =>
  [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((y, c, i) => y + c * [0.2126, 0.7152, 0.0722][i]!, 0);
const rgb = (hex: string) => `rgb:${[1, 3, 5].map((i) => hex.slice(i, i + 2).repeat(2)).join("/")}`;
const ST = "\x1b\\";
const ASK =
  // oxlint-disable-next-line no-control-regex -- escape sequences
  /\x1b\](10|11|4;(\d+));\?(?:\x07|\x1b\\)|\x1b\[\?(996)n|\x1b\[\?2031([hl])|\x1b\]22;([\w-]*)(?:\x07|\x1b\\)/g;

export interface Host {
  /** Bytes from the app: the queries are answered, OSC 22 sets the pointer, the rest goes to the screen. */
  write(bytes: Uint8Array | string): void;
  /** The app's input: keys from ghostty-web, the mouse, the replies (one listener; what came before it is replayed). */
  onInput(fn: (bytes: Uint8Array) => void): void;
  /** The palette the queries are answered from; with mode 2031 on, a change is reported to the app. */
  setPalette(p: Palette): void;
  dispose(): void;
}

/**
 * The other end of the app's I/O, over a ghostty-web terminal that is open.
 *
 * @param {Terminal} term the terminal
 * @param {Palette} palette the colours to report
 * @returns {Host} the host
 */
export const createHost = (term: Terminal, palette: Palette): Host => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  // what the app is sent before it listens (the replies to its first queries) waits for it
  let listener: ((bytes: Uint8Array) => void) | undefined;
  const early: Uint8Array[] = [];
  const send = (s: string) => {
    const bytes = encoder.encode(s);
    queueMicrotask(() => (listener ? listener(bytes) : early.push(bytes)));
  };
  let notify = false;
  const scheme = () => (luminance(palette.bg) < luminance(palette.fg) ? 1 : 2);
  const answer = (what: string, index?: string) =>
    what === "10"
      ? `\x1b]10;${rgb(palette.fg)}${ST}`
      : what === "11"
        ? `\x1b]11;${rgb(palette.bg)}${ST}`
        : `\x1b]4;${index};${rgb(palette.ansi[Number(index)] ?? "#000000")}${ST}`;

  const canvas = term.element!.querySelector("canvas")!;
  const disposeData = term.onData((data) => send(data));
  // ghostty-web 0.4 sends a plain tab for shift-tab: the back-tab of xterm instead
  term.attachCustomKeyEventHandler((e) => {
    if (e.key !== "Tab" || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false;
    send("\x1b[Z");
    return true;
  });
  // SGR mouse reports: a button press, its release, a move (32 + button, 35 with none)
  let held = -1;
  const report = (e: MouseEvent, code: number, up = false) => {
    if (!term.hasMouseTracking()) return false;
    const box = canvas.getBoundingClientRect();
    const { width, height } = term.renderer!.getMetrics();
    const x = Math.floor((e.clientX - box.left) / width) + 1;
    const y = Math.floor((e.clientY - box.top) / height) + 1;
    if (x < 1 || y < 1 || x > term.cols || y > term.rows) return false;
    send(`\x1b[<${code};${x};${y}${up ? "m" : "M"}`);
    return true;
  };
  // in the capture phase, before ghostty-web's selection takes the press
  const down = (e: MouseEvent) => {
    if (e.button !== 0 || !report(e, 0)) return;
    held = 0;
    e.stopPropagation();
    e.preventDefault();
    term.focus();
  };
  const move = (e: MouseEvent) => {
    if (report(e, held < 0 ? 35 : 32 + held)) e.stopPropagation();
  };
  const up = (e: MouseEvent) => {
    if (held < 0) return;
    held = -1;
    report(e, 0, true);
  };
  const leave = () => {
    if (term.hasMouseTracking()) send(`\x1b[<35;${term.cols + 1};${term.rows + 1}M`);
  };
  const root = term.element!;
  root.addEventListener("mousedown", down, { capture: true });
  root.addEventListener("mousemove", move, { capture: true });
  root.addEventListener("mouseleave", leave);
  window.addEventListener("mouseup", up);

  return {
    write: (bytes) => {
      const text = typeof bytes === "string" ? bytes : decoder.decode(bytes);
      const rest = text.replace(
        ASK,
        (_all, what?: string, index?: string, dsr?: string, mode?: string, pointer?: string) => {
          if (what) send(answer(what, index));
          else if (dsr) send(`\x1b[?997;${scheme()}n`);
          else if (mode) notify = mode === "h";
          else canvas.style.cursor = pointer === "default" || !pointer ? "" : pointer;
          return "";
        },
      );
      if (rest) term.write(rest);
    },
    onInput: (fn) => {
      listener = fn;
      for (const bytes of early.splice(0)) fn(bytes);
    },
    setPalette: (p) => {
      const changed = JSON.stringify(p) !== JSON.stringify(palette);
      palette = p;
      term.renderer?.setTheme(themeOf(p));
      if (changed && notify) send(`\x1b[?997;${scheme()}n`);
    },
    dispose: () => {
      disposeData.dispose();
      root.removeEventListener("mousedown", down, { capture: true });
      root.removeEventListener("mousemove", move, { capture: true });
      root.removeEventListener("mouseleave", leave);
      window.removeEventListener("mouseup", up);
    },
  };
};
