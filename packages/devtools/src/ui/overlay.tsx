// The overlay: a corner button and Alt+Shift+C open it, hovering previews an element, a click picks it; the panel shows the
// element's cssints classes by the call that made them, the winner per property with what it beat, and its tokens.
// Esc closes, the arrow keys walk the tree. It lives in a shadow root with its own sheet (built ahead, see vite.config.ts).
import "virtual:cssints.css";
import { render } from "@solidjs/web";
import { Effect, Exit, Stream, SubscriptionRef } from "effect";
import { createEffect, createMemo, createSignal, For, onCleanup, onSettled, Show } from "solid-js";

import {
  ASKED,
  type Asked,
  buildPrompt,
  type Candidate,
  type Condition,
  domPage,
  type Inspection,
  inspect,
  type Model,
  type Row,
  relative,
  session,
  Transport,
  type TransportApi,
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

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

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
interface Placement {
  dock: Dock;
  w: number;
  h: number;
}
const load = (): Placement => {
  let v: Partial<Placement> | null = null;
  try {
    v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Placement> | null;
  } catch {
    // no storage, or not ours: the defaults
  }
  const size = (n: unknown, d: number) => (typeof n === "number" && n >= MIN ? n : d);
  return {
    dock: DOCKS.find((d) => d === v?.dock) ?? "right",
    w: size(v?.w, 440),
    h: size(v?.h, 320),
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
        class={cx(s.chip, c.holds && s.holds)}
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
          fallback={<span class={cx(s.value, s.muted)}>nothing applies now</span>}
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
        <div class={cx(s.sub, s.muted)}>
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
          <div class={cx(s.sub, s.off)} data-inactive={c.selector}>
            {c.decl.prop}: {c.decl.value} <span class={s.muted}>{where(c)}</span>{" "}
            <Conditions of={c.conditions} />
          </div>
        )}
      </For>
      <For each={props.row.verdicts.filter((v) => v.reason)}>
        {(v) => (
          <div class={v.status === "mismatch" ? s.reason : cx(s.sub, s.unsure)}>{v.reason}</div>
        )}
      </For>
    </div>
  );
}

// The panel re-inspects every 600 ms: an unchanged result keeps the old object, so the rows are not rebuilt (a rebuilt <pre>
// loses its scroll position)
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

function Panel(props: { inspection: Inspection; build?: boolean }) {
  const i = () => props.inspection;
  return (
    <>
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
                  <div class={cx(s.classRow, !c.active && s.off)} data-class={c.cls}>
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
                    <div class={cx(s.sub, s.muted)}>
                      {t.registered ? "the initial value of its @property" : "not set by cssints"}
                    </div>
                  }
                >
                  {(src) => (
                    <div class={cx(s.sub, s.muted)}>
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

const firstChild = (el: Element) => el.firstElementChild ?? undefined;

function App(props: {
  model: () => Model | undefined;
  setActive: (on: boolean) => void;
  host: Element;
  /** a build's overlay: open from the start, the sites are text (there is no editor to open them in) */
  build?: boolean;
  /** only with `opencode` on in the dev server: sends an instruction about the picked element; `asked` is how it goes */
  ask?: (prompt: string) => void;
  asked: () => AskState | undefined;
}) {
  const [open, setOpen] = createSignal(false);
  const [picking, setPicking] = createSignal(false);
  const [hovered, setHovered] = createSignal<Element>();
  const [selected, setSelected] = createSignal<Element>();
  const [tick, setTick] = createSignal(0);
  const [place, setPlace] = createSignal(load());
  const horizontal = () => place().dock === "left" || place().dock === "right";
  const moveTo = (dock: Dock) => {
    setPlace((p) => ({ ...p, dock }));
    save(place());
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
  const send = () => {
    const m = props.model();
    const el = selected();
    const text = input()?.value.trim();
    const i = m && el?.isConnected ? run(m, el) : undefined;
    if (text && el && typeof i === "object") props.ask?.(buildPrompt(i, el, text));
  };

  const toggle = (on = !open()) => {
    setOpen(on);
    setPicking(on && !selected());
    props.setActive(on);
  };
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
      if (e.composedPath()[0] instanceof HTMLTextAreaElement) return;
      const el = selected();
      if (!el || picking()) return;
      const next =
        e.key === "ArrowUp"
          ? (el.parentElement ?? undefined)
          : e.key === "ArrowDown"
            ? firstChild(el)
            : e.key === "ArrowLeft"
              ? (el.previousElementSibling ?? undefined)
              : e.key === "ArrowRight"
                ? (el.nextElementSibling ?? undefined)
                : undefined;
      if (next && next !== props.host) {
        e.preventDefault();
        setSelected(next);
      }
    };
    // @effect-diagnostics-next-line globalTimers:off -- plain UI code: re-inspect while open (hover, resize, a query)
    const timer = setInterval(() => open() && setTick((n) => n + 1), 600);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("click", click, true);
    window.addEventListener("keydown", key, true);
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("click", click, true);
      window.removeEventListener("keydown", key, true);
    };
  });
  onCleanup(() => props.setActive(false));
  onSettled(() => {
    if (props.build) toggle(true);
  });

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
            <span class={s.tag}>
              {typeof inspection() === "object" ? (inspection() as Inspection).element : ""}
            </span>
          </div>
        )}
      </Show>
      <Show when={open()}>
        <aside
          class={cx(s.panel, PANEL[place().dock])}
          data-devtools="panel"
          data-dock={place().dock}
          style={
            horizontal()
              ? { width: `min(${place().w}px, 100vw)`, height: "" }
              : { height: `min(${place().h}px, 100vh)`, width: "" }
          }
        >
          <div class={s.bar}>
            <span class={s.title} data-devtools="element">
              {typeof inspection() === "object"
                ? (inspection() as Inspection).element
                : "pick an element"}
            </span>
            <button
              class={cx(s.button, picking() && s.pressed)}
              data-devtools="pick"
              data-on={picking() ? "yes" : "no"}
              title="pick an element"
              onClick={() => setPicking(!picking())}
            >
              pick
            </button>
            <For each={DOCKS}>
              {(d) => (
                <button
                  class={cx(s.button, place().dock === d && s.pressed)}
                  data-devtools="dock"
                  data-dock={d}
                  title={`dock ${d}`}
                  onClick={() => moveTo(d)}
                >
                  {ICON[d]}
                </button>
              )}
            </For>
            <button
              class={s.button}
              title="parent (↑)"
              onClick={() => setSelected((el) => el?.parentElement ?? el)}
            >
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
              {(i) => <Panel inspection={i()} build={props.build} />}
            </Show>
          </Show>
          <Show when={props.ask && selected()}>
            <div class={s.ask} data-devtools="ask">
              <textarea
                ref={setInput}
                class={s.askInput}
                data-devtools="ask-input"
                rows="2"
                placeholder="Ask OpenCode to change this element (Enter sends)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Show when={props.asked()}>
                {(a) => (
                  <div
                    class={cx(
                      s.sub,
                      a().status === "completed"
                        ? s.ok
                        : a().status === "running" || a().status === "sending"
                          ? s.muted
                          : s.bad,
                    )}
                    data-devtools="ask-status"
                    data-status={a().status}
                    title={a().id}
                  >
                    {a().message ?? `${a().status}${a().id ? ` · ${a().id}` : ""}`}
                  </div>
                )}
              </Show>
            </div>
          </Show>
        </aside>
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
      setAsked({ status: "sending" });
      last.ref += 1;
      transport.ask?.(last.ref, prompt);
    });
  if (ask)
    transport.on(ASKED, (data) => {
      const a = data as Asked;
      if (a.ref === last.ref) setAsked((prev) => ({ ...prev, ...a }));
    });
  render(
    () => (
      <App
        model={model}
        setActive={(on) => Effect.runSync(s.setActive(on))}
        host={host}
        build={transport.build}
        ask={ask}
        asked={asked}
      />
    ),
    root,
  );
}
