// The overlay: a corner button and Alt+Shift+C open it, hovering previews an element, a click picks it; the panel shows the
// element's cssints classes by the call that made them, the winner per property with what it beat, and its tokens.
// Esc closes, the arrow keys walk the tree. It lives in a shadow root with its own sheet (built ahead, see vite.config.ts).
import "virtual:cssints.css";
import { Portal, render } from "@solidjs/web";
import { Effect, Exit, Stream, SubscriptionRef } from "effect";
import { createEffect, createMemo, createSignal, For, onCleanup, onSettled, Show } from "solid-js";
import { cn } from "cssints" with { type: "cssints" };

import {
  ASKED,
  type Asked,
  type Box,
  buildPrompt,
  type Candidate,
  type Condition,
  domPage,
  type Inspection,
  inspect,
  LINKED,
  type Linked,
  type Model,
  pagePrompt,
  type Row,
  relative,
  session,
  Transport,
  type TransportApi,
  type Xray,
  xray,
} from "../core/index.ts";
import * as s from "./styles.ts";

// The sheet of the overlay, put in by the build (vite.config.ts) in place of this string.
const SHEET = "__CSSINTS_DEVTOOLS_SHEET__";
const HOST = "cssints-devtools";

/** how the instruction last sent goes: the server's `Asked`, or `sending` before it answers */
interface AskState {
  status: string;
  id?: string;
  message?: string;
}

// where the panel sits and how big it is along that axis, kept per origin
const DOCKS = ["left", "top", "bottom", "right"] as const;
type Dock = (typeof DOCKS)[number];
const ICON: Record<Dock, string> = { left: "◧", top: "⬒", bottom: "⬓", right: "◨" };
const PANEL: Record<Dock, string> = {
  left: s.dockLeft,
  top: s.dockTop,
  bottom: s.dockBottom,
  right: s.dockRight,
};
const KEY = "cssints-devtools:dock";
const MIN = 200;

// The X-ray's scopes, in the order the bar button cycles them: the picked element, its subtree, the page, off.
const XRAY = ["off", "element", "subtree", "page"] as const;
type XrayScope = (typeof XRAY)[number];
const XRAY_NAME: Record<XrayScope, string> = {
  off: "xray",
  element: "xray:el",
  subtree: "xray:tree",
  page: "xray:page",
};
interface Placement {
  dock: Dock;
  w: number;
  h: number;
  /** the panel lives in a window of its own (opened again on the next open, if the browser lets it) */
  detached: boolean;
}
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Placement> | null;
  } catch {
    return null; // no storage, or not ours: the defaults
  }
};
const load = () => {
  const v = read();
  const size = (n: number | undefined, d: number) => (typeof n === "number" && n >= MIN ? n : d);
  return {
    dock: DOCKS.find((d) => d === v?.dock) ?? "right",
    w: size(v?.w, 440),
    h: size(v?.h, 320),
    detached: v?.detached === true,
  };
};
const save = (p: Placement) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage is off: the choice lasts until the reload
  }
};

const run = (model: Model, el: Element): Inspection | string => {
  // @effect-diagnostics-next-line strictEffectProvide:off -- the UI's edge: the one place the core meets the page
  const exit = Effect.runSyncExit(inspect(model, el).pipe(Effect.provide(domPage)));
  return Exit.isSuccess(exit) ? exit.value : String(exit.cause);
};

const openInEditor = (file: string, line: number, column: number) =>
  // @effect-diagnostics-next-line globalFetch:off -- plain UI code: a fire-and-forget request to Vite's middleware
  void fetch(`/__open-in-editor?file=${encodeURIComponent(`${file}:${line}:${column + 1}`)}`);

const Conditions = (props: { of: readonly Condition[] }) => (
  <For each={props.of}>
    {(c) => (
      <span
        class={cn(s.chip, c.holds && s.holds)}
        title={c.holds ? "holds now" : "does not hold now"}
      >
        {c.text}
      </span>
    )}
  </For>
);

const where = (c: Candidate) => `${c.selector}  ${c.layer || "unlayered"}`;

function PropRow(props: { row: Row }) {
  const verdict = () => {
    const vs = props.row.verdicts;
    return (
      vs.find((v) => v.status === "mismatch") ?? vs.find((v) => v.status === "unverified") ?? vs[0]
    );
  };
  return (
    <div class={s.prop} data-prop={props.row.prop} data-status={verdict()?.status ?? "none"}>
      <div class={s.propHead}>
        <span class={s.propName}>{props.row.prop}</span>
        <Show
          when={props.row.winner}
          fallback={<span class={cn(s.value, s.muted)}>nothing applies now</span>}
        >
          {(w) => (
            <span class={s.value} data-winner={w().selector} data-value={w().decl.value}>
              {w().decl.value}
              {w().decl.important ? " !important" : ""}
            </span>
          )}
        </Show>
        <Show when={verdict()}>
          {(v) => (
            <span
              class={v().status === "ok" ? s.ok : v().status === "mismatch" ? s.bad : s.unsure}
              title={v().reason ?? `computed ${v().computed}`}
              data-computed={v().computed}
            >
              {v().status === "ok" ? "✓" : v().status === "mismatch" ? "✗" : "?"}
            </span>
          )}
        </Show>
      </div>
      <Show when={props.row.winner}>
        {(w) => (
          <div class={s.sub}>
            <span class={s.muted}>{where(w())}</span> <Conditions of={w().conditions} />
          </div>
        )}
      </Show>
      <Show when={props.row.lost.length}>
        <div class={cn(s.sub, s.muted)}>
          except {props.row.lost.map((l) => `${l.prop} (${l.by.selector})`).join(", ")}
        </div>
      </Show>
      <For each={props.row.overridden}>
        {(c) => (
          <div class={s.sub} data-overridden={c.selector}>
            <span class={s.struck}>
              {c.decl.prop}: {c.decl.value}
            </span>{" "}
            <span class={s.muted}>{where(c)}</span>
          </div>
        )}
      </For>
      <For each={props.row.inactive}>
        {(c) => (
          <div class={cn(s.sub, s.off)} data-inactive={c.selector}>
            {c.decl.prop}: {c.decl.value} <span class={s.muted}>{where(c)}</span>{" "}
            <Conditions of={c.conditions} />
          </div>
        )}
      </For>
      <For each={props.row.verdicts.filter((v) => v.reason)}>
        {(v) => (
          <div class={v.status === "mismatch" ? s.reason : cn(s.sub, s.unsure)}>{v.reason}</div>
        )}
      </For>
    </div>
  );
}

// The panel re-inspects every 600 ms: an unchanged result keeps the old object, so the rows are not rebuilt (a rebuilt <pre>
// loses its scroll position)
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

function Panel(props: { inspection: Inspection; build?: boolean; xray?: Xray }) {
  const i = () => props.inspection;
  return (
    <>
      <Show when={props.xray}>
        {(x) => {
          const root = () => x().root;
          const spaces = () => x().spaces.filter((space) => space.depth === 0);
          return (
            <div class={s.section} data-devtools="xray">
              <h3 class={s.heading}>X-ray</h3>
              <div class={s.prop} data-xray="box">
                <div class={s.propHead}>
                  <span class={s.propName}>{root().label}</span>
                  <span class={s.value} data-xray-value="size">
                    {measureText(root())}
                  </span>
                  <span
                    class={s.muted}
                  >{`${x().boxes.length} ${x().boxes.length === 1 ? "box" : "boxes"} · ${x().grid}px grid`}</span>
                </div>
                <div class={cn(s.sub, s.muted)} data-xray-value="inside">
                  {insideText(root()) || "no padding, border, radius or gap"}
                </div>
                <Show when={spaces().length}>
                  <div class={cn(s.sub, s.muted)} data-xray-value="spaces">
                    {`spaces: ${spaces()
                      .map((space) => `${Math.round(space.size)}${space.axis === "x" ? "→" : "↓"}`)
                      .join("  ")}`}
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </Show>
      <div class={s.section} data-devtools="classes">
        <h3 class={s.heading}>Classes by call</h3>
        <For each={i().groups}>
          {(g) => (
            <div>
              <Show when={g.site} fallback={<div class={s.muted}>no cssints call</div>}>
                {(site) => (
                  <>
                    <Show
                      when={!props.build}
                      fallback={
                        <div
                          class={s.siteText}
                          data-site={`${relative(i().root, site().file)}:${site().line}`}
                        >
                          {relative(i().root, site().file)}:{site().line}
                        </div>
                      }
                    >
                      <button
                        class={s.site}
                        data-site={`${relative(i().root, site().file)}:${site().line}`}
                        onClick={() => openInEditor(site().file, site().line, site().column)}
                      >
                        {relative(i().root, site().file)}:{site().line} ↗
                      </button>
                    </Show>
                    <Show when={site().text}>
                      <pre class={s.callText} data-call>
                        {site().text}
                      </pre>
                    </Show>
                  </>
                )}
              </Show>
              <For each={g.classes}>
                {(c) => (
                  <div class={cn(s.classRow, !c.active && s.off)} data-class={c.cls}>
                    <span>.{c.cls}</span>
                    <span>
                      {c.kind === "marker"
                        ? `marker of kernel ${c.plugin}`
                        : c.kind === "group"
                          ? "group marker"
                          : c.kind === "other"
                            ? "not cssints"
                            : c.decls.map((d) => `${d.prop}: ${d.value}`).join("; ")}
                      {c.kind === "class" && c.plugin ? `  (${c.plugin})` : ""}{" "}
                      <Conditions of={c.conditions} />
                    </span>
                    <span class={s.muted}>{c.layer}</span>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
      <div class={s.section} data-devtools="properties">
        <h3 class={s.heading}>Properties</h3>
        <For each={i().rows}>{(r) => <PropRow row={r} />}</For>
      </div>
      <Show when={i().tokens.length}>
        <div class={s.section} data-devtools="tokens">
          <h3 class={s.heading}>Tokens</h3>
          <For each={i().tokens}>
            {(t) => (
              <div class={s.prop} data-token={t.name}>
                <div class={s.propHead}>
                  <span class={s.propName}>{t.name}</span>
                  <span class={s.value}>{t.computed || "(not set)"}</span>
                  <span class={s.muted}>{t.path}</span>
                </div>
                <Show
                  when={t.source}
                  fallback={
                    <div class={cn(s.sub, s.muted)}>
                      {t.registered ? "the initial value of its @property" : "not set by cssints"}
                    </div>
                  }
                >
                  {(src) => (
                    <div class={cn(s.sub, s.muted)}>
                      from {src().wrap.join(" ")} {src().selector} {src().layer || "unlayered"} on{" "}
                      {src().on}
                    </div>
                  )}
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </>
  );
}

// the arrow keys and the parent button walk the tree from the element the panel shows
const parent = (el: Element) => el.parentElement;

const rounded = (n: number) => Math.round(n * 10) / 10;
const two = (a: number, b: number) => (a === b ? `${a}` : `${a} ${b}`);
const four = (t: number, r: number, b: number, l: number) =>
  t === b && r === l ? two(t, r) : `${t} ${r} ${b} ${l}`;

// the box's size as the label prints it
const measureText = (b: Box) => `${Math.round(b.w)}×${Math.round(b.h)}`;

// what the box spends inside itself: the padding, the border, the radii, a flex/grid gap — the ones that are not 0
const insideText = (b: Box) => {
  const pad = four(rounded(b.pad[0]), rounded(b.pad[1]), rounded(b.pad[2]), rounded(b.pad[3]));
  const border = four(
    rounded(b.border[0]),
    rounded(b.border[1]),
    rounded(b.border[2]),
    rounded(b.border[3]),
  );
  const radius = four(
    rounded(b.radius[0]),
    rounded(b.radius[1]),
    rounded(b.radius[2]),
    rounded(b.radius[3]),
  );
  const parts = [
    b.pad.some((n) => n > 0) ? `pad ${pad}` : "",
    b.border.some((n) => n > 0) ? `border ${border}` : "",
    b.radius.some((n) => n > 0) ? `radius ${radius}` : "",
    b.gap.some((n) => n > 0) ? `gap ${two(rounded(b.gap[0]), rounded(b.gap[1]))}` : "",
  ];
  return parts.filter((part) => part !== "").join("  ");
};

// the grid inside the root, from its border box's own corner: two gradients, one per axis. Kebab-case keys: Solid 2's
// style object writes each one with `style.setProperty`, which takes a CSS property name, not its camelCase spelling
const gridLines = (step: number) => ({
  "background-image":
    `repeating-linear-gradient(to right, rgb(96 165 250 / 0.45) 0 1px, transparent 1px ${step}px), ` +
    `repeating-linear-gradient(to bottom, rgb(96 165 250 / 0.45) 0 1px, transparent 1px ${step}px)`,
  "background-origin": "border-box",
  "background-clip": "border-box",
});

function XrayLayer(props: { of: Xray; scope: XrayScope }) {
  const content = (b: Box) => ({
    left: `${b.x + b.border[3] + b.pad[3]}px`,
    top: `${b.y + b.border[0] + b.pad[0]}px`,
    width: `${Math.max(0, b.w - b.border[1] - b.border[3] - b.pad[1] - b.pad[3])}px`,
    height: `${Math.max(0, b.h - b.border[0] - b.border[2] - b.pad[0] - b.pad[2])}px`,
  });
  // the label of a space only when the room is wide enough to hold it; the root's own children only (the rest is noise)
  const labelled = (size: number) => size >= 8;
  const spaces = () =>
    props.scope === "page" ? [] : props.of.spaces.filter((space) => space.depth === 0);
  return (
    <div class={s.xrayLayer} data-devtools="xray-layer" data-scope={props.scope}>
      <For each={props.of.boxes}>
        {(b) => (
          <div
            class={b.depth === 0 ? cn(s.xrayBox, s.xrayRoot) : s.xrayBox}
            data-depth={b.depth}
            data-box={b.label}
            title={`${b.label}  ${measureText(b)}${insideText(b) ? `  ${insideText(b)}` : ""}`}
            style={{
              left: `${b.x}px`,
              top: `${b.y}px`,
              width: `${b.w}px`,
              height: `${b.h}px`,
              "border-radius": b.radius.map((r) => `${r}px`).join(" "),
              ...(b.depth === 0 && props.scope !== "page" ? gridLines(props.of.grid) : {}),
            }}
          >
            <Show when={b.depth === 0 && props.scope !== "page"}>
              <div class={s.xrayContent} data-devtools="xray-content" style={content(b)} />
              <span class={s.xrayValue} data-devtools="xray-value">
                {`${measureText(b)}${insideText(b) ? `  ${insideText(b)}` : ""}`}
              </span>
            </Show>
          </div>
        )}
      </For>
      <For each={spaces()}>
        {(space) => (
          <div
            class={s.xraySpace}
            data-space={`${space.axis}:${Math.round(space.size)}`}
            style={{
              left: `${space.x}px`,
              top: `${space.y}px`,
              width: `${space.w}px`,
              height: `${space.h}px`,
            }}
          >
            <Show when={labelled(space.axis === "y" ? space.size : space.w)}>
              <span class={s.xrayValue}>{`${Math.round(space.size)}`}</span>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}

const STEPS = new Map<string, (el: Element) => Element | null>([
  ["ArrowUp", parent],
  ["ArrowDown", (el) => el.firstElementChild],
  ["ArrowLeft", (el) => el.previousElementSibling],
  ["ArrowRight", (el) => el.nextElementSibling],
]);

function App(props: {
  model: () => Model | undefined;
  setActive: (on: boolean) => void;
  host: Element;
  /** a build's overlay: open from the start, the sites are text (there is no editor to open them in) */
  build?: boolean;
  /** only with `opencode` on in the dev server: sends an instruction about the picked element; `asked` is how it goes */
  ask?: (prompt: string) => void;
  asked: () => AskState | undefined;
  /** with `ask`: probes for the OpenCode service; `linked` is what the last probe found (undefined before the first answer) */
  link?: () => void;
  linked: () => Linked | undefined;
}) {
  const [open, setOpen] = createSignal(false);
  const [picking, setPicking] = createSignal(false);
  const [hovered, setHovered] = createSignal<Element>();
  const [selected, setSelected] = createSignal<Element>();
  const [xrayScope, setXrayScope] = createSignal<XrayScope>("off");
  const [tick, setTick] = createSignal(0);
  const [place, setPlace] = createSignal(load());
  const horizontal = () => place().dock === "left" || place().dock === "right";
  // the OpenCode box sits at the panel's bottom edge, or, in a wide strip (docked top or bottom; a window wider than tall), at its right edge
  const strip = () => {
    const w = win();
    if (!w) return place().dock === "top" || place().dock === "bottom";
    tick(); // the window's size is read on the panel's timer
    return w.innerWidth > w.innerHeight;
  };
  const [win, setWin] = createSignal<Window>();
  const [blocked, setBlocked] = createSignal(false);
  const closeWin = () => {
    win()?.close();
    setWin(undefined);
  };
  const keep = (p: Partial<Placement>) => {
    const next = { ...place(), ...p };
    setPlace(next); // a write shows after the flush: save the value, not place()
    save(next);
  };
  // the window is same-origin (about:blank), so the panel is rendered by this very Solid tree into its body (a Portal): the
  // signals, the picking and the highlight stay in the page, and the panel follows them live
  const detach = () => {
    const w = window.open("", "cssints-devtools", "popup,width=520,height=760");
    setBlocked(!w);
    if (!w) return;
    const style = w.document.createElement("style");
    style.textContent = SHEET;
    w.document.title = "cssints devtools";
    w.document.head.replaceChildren(style);
    w.document.body.replaceChildren();
    w.document.body.style.cssText = `margin: 0; background: ${s.panelBg}`;
    setWin(w);
    keep({ detached: true });
  };
  const redock = () => {
    closeWin();
    keep({ detached: false });
  };
  const moveTo = (dock: Dock) => {
    closeWin();
    keep({ dock, detached: false });
  };
  // the grip is captured by the pointer, so the page does not see the drag; the size is cut to leave a strip of page
  const resize = (e: PointerEvent & { currentTarget: HTMLElement }) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const { dock } = place();
    const v = {
      left: e.clientX,
      top: e.clientY,
      right: innerWidth - e.clientX,
      bottom: innerHeight - e.clientY,
    };
    const n = Math.round(
      Math.max(MIN, Math.min(v[dock], (horizontal() ? innerWidth : innerHeight) - 80)),
    );
    setPlace((p) => (horizontal() ? { ...p, w: n } : { ...p, h: n }));
  };
  // the grip sits on the panel's inner edge: that far from the page's edge, 3 px of it on the panel
  const edge = () => {
    const { dock, w, h } = place();
    const at = horizontal() ? `calc(min(${w}px, 100vw) - 3px)` : `calc(min(${h}px, 100vh) - 3px)`;
    return Object.fromEntries(DOCKS.map((d) => [d, d === dock ? at : ""]));
  };
  const target = () => (picking() ? (hovered() ?? selected()) : selected());
  const [input, setInput] = createSignal<HTMLTextAreaElement>();
  // the box keeps its text until the session exists, so that a missing service costs no retyping
  createEffect(
    () => props.asked()?.status,
    (status) => {
      const box = input();
      if (status === "running" && box) box.value = "";
    },
  );
  // an unavailable service may be started by now: look again
  createEffect(
    () => props.asked()?.status,
    (status) => {
      if (status === "unavailable") props.link?.();
    },
  );
  const send = () => {
    const m = props.model();
    const el = selected();
    const text = input()?.value.trim();
    if (!text) return;
    const i = m && el?.isConnected ? run(m, el) : undefined;
    props.ask?.(
      el && typeof i === "object" ? buildPrompt(i, el, text) : pagePrompt(text, document),
    );
  };
  const link = () => props.linked();
  const linkState = () => (link() ? (link()?.connected ? "connected" : "disconnected") : "unknown");
  const attached = () => props.linked()?.session;
  const sessionText = () => {
    const id = attached();
    return id
      ? `attached session ${id.length > 14 ? `${id.slice(0, 14)}…` : id}`
      : "no session attached: a prompt starts a new one";
  };

  const toggle = (on = !open()) => {
    setOpen(on);
    setPicking(on && !selected());
    props.setActive(on);
    if (on) props.link?.();
    if (!on) closeWin();
    else if (place().detached && !win()) detach();
  };
  // one button, four scopes: the panel is narrow, and the mode is a glance, not a setting
  const cycleXray = () =>
    setXrayScope((scope) => XRAY[(XRAY.indexOf(scope) + 1) % XRAY.length] ?? "off");
  // from the element the panel shows (the hovered one while picking: the pointer may have left the page for the window)
  const go = (step: (el: Element) => Element | null) => {
    const el = target();
    const next = el && step(el);
    if (!next || next === props.host) return false;
    setSelected(next);
    setPicking(false);
    return true;
  };
  const key = (e: KeyboardEvent) => {
    if (e.altKey && e.shiftKey && e.code === "KeyC") {
      e.preventDefault();
      toggle();
      return;
    }
    if (!open()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (picking() && selected()) setPicking(false);
      else toggle(false);
      return;
    }
    // arrows in the prompt box move its caret, not the selection
    if ((e.composedPath()[0] as Element | undefined)?.localName === "textarea") return;
    if (e.key === "x" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      cycleXray();
      return;
    }
    // the page keeps its arrows while it picks; in the window they walk from the hovered element
    if (picking() && e.view === window) return;
    const step = STEPS.get(e.key);
    if (step && go(step)) e.preventDefault();
  };
  createEffect(win, (w) => {
    w?.addEventListener("keydown", key, true);
    return () => w?.removeEventListener("keydown", key, true);
  });
  const inspection = createMemo(
    () => {
      tick();
      const m = props.model();
      const el = target();
      return open() && m && el?.isConnected ? run(m, el) : undefined;
    },
    { equals: same },
  );
  const rect = createMemo(() => {
    tick();
    return open() ? target()?.getBoundingClientRect() : undefined;
  });
  // the X-ray of the target — the picked (or hovered) element, its subtree, or the page — recomputed with the panel's
  // timer so a hover, a scroll or a query is followed live, like the inspection above it
  const measured = createMemo(() => {
    tick();
    const scope = xrayScope();
    if (!open() || scope === "off") return undefined;
    if (scope === "page") return xray(document.body, { depth: 64, max: 400, spaces: 0 });
    const el = target();
    return el?.isConnected
      ? xray(el, { depth: scope === "element" ? 0 : 6, spaces: scope === "element" ? 1 : 2 })
      : undefined;
  });

  onSettled(() => {
    const mine = (e: Event) => e.composedPath().includes(props.host);
    const move = (e: PointerEvent) => {
      if (!picking() || mine(e)) return;
      if (e.target instanceof Element && e.target !== hovered()) setHovered(e.target);
    };
    const click = (e: MouseEvent) => {
      if (!picking() || mine(e) || !(e.target instanceof Element)) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected(e.target);
      setPicking(false);
    };
    // @effect-diagnostics-next-line globalTimers:off -- plain UI code: re-inspect while open (hover, resize, a query)
    const timer = setInterval(() => {
      if (win()?.closed) redock();
      if (open()) setTick((n) => n + 1);
    }, 600);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("click", click, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("pagehide", closeWin);
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("click", click, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("pagehide", closeWin);
    };
  });
  onCleanup(() => {
    props.setActive(false);
    closeWin();
  });
  onSettled(() => {
    if (props.build) toggle(true);
  });

  const Docked = () => (
    <>
      <aside
        class={cn(
          s.panel,
          strip() ? s.strip : s.column,
          win() ? s.dockWindow : PANEL[place().dock],
        )}
        data-devtools="panel"
        data-dock={place().dock}
        data-detached={win() ? "yes" : "no"}
        style={
          win()
            ? { width: "", height: "" }
            : horizontal()
              ? { width: `min(${place().w}px, 100vw)`, height: "" }
              : { height: `min(${place().h}px, 100vh)`, width: "" }
        }
      >
        <div class={s.main}>
          <div class={s.bar} data-devtools="bar">
            <Show when={typeof inspection() === "object" && (inspection() as Inspection).names[0]}>
              <span class={s.name} data-devtools="name" title="readable class (dev only)">
                {(inspection() as Inspection).names.join(" ")}
              </span>
            </Show>
            <span class={s.title} data-devtools="element">
              {typeof inspection() === "object"
                ? (inspection() as Inspection).element
                : "pick an element"}
            </span>
            <button
              class={cn(s.button, picking() && s.pressed)}
              data-devtools="pick"
              data-on={picking() ? "yes" : "no"}
              title="pick an element"
              onClick={() => setPicking(!picking())}
            >
              pick
            </button>
            <button
              class={cn(s.button, xrayScope() !== "off" && s.pressed)}
              data-devtools="xray"
              data-on={xrayScope() !== "off" ? "yes" : "no"}
              data-scope={xrayScope()}
              title="x-ray: the picked element, its subtree, the page (x)"
              onClick={cycleXray}
            >
              {XRAY_NAME[xrayScope()]}
            </button>
            <button
              class={cn(s.button, win() && s.pressed)}
              data-devtools="detach"
              data-on={win() ? "yes" : "no"}
              title={win() ? "dock back" : "detach into a window"}
              onClick={() => (win() ? redock() : detach())}
            >
              ⧉
            </button>
            <For each={DOCKS}>
              {(d) => (
                <button
                  class={cn(s.button, place().dock === d && s.pressed)}
                  data-devtools="dock"
                  data-dock={d}
                  title={`dock ${d}`}
                  onClick={() => moveTo(d)}
                >
                  {ICON[d]}
                </button>
              )}
            </For>
            <button class={s.button} title="parent (↑)" onClick={() => go(parent)}>
              ↑
            </button>
            <button
              class={s.button}
              data-devtools="close"
              title="close (Esc)"
              onClick={() => toggle(false)}
            >
              ×
            </button>
          </div>
          <Show when={blocked() && !win()}>
            <div class={s.reason} data-devtools="blocked">
              The browser blocked the window. Allow pop-ups for this site and press ⧉ again.
            </div>
          </Show>
          <div class={s.body} data-devtools="body">
            <Show
              when={props.model()}
              fallback={
                <div class={s.hint}>
                  {props.build ? "loading the table…" : "waiting for the dev server…"}
                </div>
              }
            >
              <Show
                when={typeof inspection() === "object" ? (inspection() as Inspection) : undefined}
                fallback={
                  <div class={s.hint}>
                    {typeof inspection() === "string"
                      ? inspection()
                      : "hover an element and click to pick it"}
                  </div>
                }
              >
                {(i) => <Panel inspection={i()} build={props.build} xray={measured()} />}
              </Show>
            </Show>
          </div>
        </div>
        <Show when={props.ask}>
          <div
            class={cn(s.ask, strip() ? s.askSide : s.askBottom)}
            data-devtools="ask"
            data-layout={strip() ? "side" : "bottom"}
          >
            <div class={s.askHead}>
              <span class={s.askTitle} data-devtools="ask-title">
                OpenCode
              </span>
              <span class={cn(s.code, s.muted)} data-devtools="ask-link" data-link={linkState()}>
                <span class={cn(s.dot, linkState() === "connected" ? s.dotOn : s.dotOff)} />{" "}
                {linkState() === "connected"
                  ? "connected"
                  : linkState() === "unknown"
                    ? "checking"
                    : "not connected"}
              </span>
            </div>
            <textarea
              ref={setInput}
              class={cn(s.askInput, strip() && s.askInputGrow)}
              data-devtools="ask-input"
              rows="2"
              placeholder={
                selected()
                  ? "Ask OpenCode to change this element (Enter sends)"
                  : "Ask OpenCode to change the page, or pick an element first (Enter sends)"
              }
              onFocus={() => props.link?.()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div
              class={cn(s.code, s.muted)}
              data-devtools="ask-status"
              data-link={linkState()}
              data-status={props.asked()?.status ?? "idle"}
            >
              <Show when={link()} fallback="Looking for an OpenCode service…">
                {(k) => (
                  <Show
                    when={k().connected}
                    fallback={`Not connected. Start OpenCode (or run \`opencode serve --service\`) and run /cssints-devtools in a session to attach it to this server; the server finds OpenCode by itself. Without a session a prompt opens a new one in ${k().directory}. @opencode/client must be in the devDependencies of the app.${k().message ? ` ${k().message}` : ""}`}
                  >
                    {`connected to ${k().url} · `}
                    <span data-devtools="ask-session" title={attached()}>
                      {sessionText()}
                    </span>
                    <Show when={props.asked()}>
                      {(a) => (
                        <span
                          class={
                            a().status === "completed"
                              ? s.ok
                              : a().status === "running" || a().status === "sending"
                                ? s.muted
                                : s.bad
                          }
                          data-devtools="ask-state"
                        >
                          {` · ${a().message ?? a().status}`}
                        </span>
                      )}
                    </Show>
                  </Show>
                )}
              </Show>
            </div>
          </div>
        </Show>
      </aside>
      <Show when={!win()}>
        <div
          class={horizontal() ? s.gripX : s.gripY}
          data-devtools="grip"
          style={edge()}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
          }}
          onPointerMove={resize}
          onPointerUp={() => save(place())}
        />
      </Show>
    </>
  );

  return (
    <>
      <button
        class={s.fab}
        data-devtools="toggle"
        title="cssints devtools (Alt+Shift+C)"
        onClick={() => toggle()}
      >
        cssints
      </button>
      <Show when={rect()}>
        {(r) => (
          <div
            class={s.highlight}
            style={{
              top: `${r().top}px`,
              left: `${r().left}px`,
              width: `${r().width}px`,
              height: `${r().height}px`,
            }}
          >
            <span class={s.tag} data-devtools="tag">
              {typeof inspection() === "object"
                ? `${(inspection() as Inspection).names.join(" ")} ${(inspection() as Inspection).element}`.trim()
                : ""}
            </span>
          </div>
        )}
      </Show>
      <Show when={measured()}>{(x) => <XrayLayer of={x()} scope={xrayScope()} />}</Show>
      <Show when={open()}>
        <Show when={win()} fallback={<Docked />}>
          {(w) => (
            <Portal mount={w().document.body}>
              <Docked />
            </Portal>
          )}
        </Show>
      </Show>
    </>
  );
}

/**
 * Puts the overlay in the page, connected to the dev server (virtual:cssints/devtools calls it).
 * @param {TransportApi & { root: string; build?: boolean }} transport the HMR channel, and the root of the app; in a build
 *   (`build`) the table comes from the static asset and the overlay opens at once
 */
export function mount(transport: TransportApi & { root: string; build?: boolean }) {
  if (document.querySelector(HOST)) return;
  const host = document.createElement(HOST);
  host.setAttribute("style", "all: initial");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = SHEET;
  const root = document.createElement("div");
  shadow.append(style, root);
  document.documentElement.append(host);

  const s = Effect.runSync(session().pipe(Effect.provideService(Transport, transport)));
  const [model, setModel] = createSignal<Model>();
  Effect.runFork(
    Stream.runForEach(SubscriptionRef.changes(s.model), (m) =>
      Effect.sync(() => setModel(() => m)),
    ),
  );
  // the answers of the dev server to the instruction last sent; one at a time, an older ref is ignored
  const [asked, setAsked] = createSignal<AskState>();
  const last = { ref: 0 };
  const ask =
    transport.ask &&
    ((prompt: string) => {
      setAsked((prev) => ({ status: "sending", id: prev?.id }));
      last.ref += 1;
      transport.ask?.(last.ref, prompt);
    });
  if (ask)
    transport.on(ASKED, (data) => {
      const a = data as Asked;
      if (a.ref === last.ref) setAsked((prev) => ({ ...prev, ...a }));
    });
  const [linked, setLinked] = createSignal<Linked>();
  if (transport.link) transport.on(LINKED, (data) => setLinked(data as Linked));
  render(
    () => (
      <App
        model={model}
        setActive={(on) => Effect.runSync(s.setActive(on))}
        host={host}
        build={transport.build}
        ask={ask}
        asked={asked}
        link={transport.link}
        linked={linked}
      />
    ),
    root,
  );
}
