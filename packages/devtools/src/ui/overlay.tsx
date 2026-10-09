// The overlay: a corner button and Alt+Shift+C open it, hovering previews an element, a click picks it; the panel shows the
// element's cssints classes by the call that made them, the winner per property with what it beat, and its tokens.
// Esc closes, the arrow keys walk the tree. It lives in a shadow root with its own sheet (built ahead, see vite.config.ts).
import "virtual:cssints.css";
import { render } from "@solidjs/web";
import { Effect, Exit, Stream, SubscriptionRef } from "effect";
import { createMemo, createSignal, For, onCleanup, onSettled, Show } from "solid-js";

import {
  type Candidate,
  type Condition,
  domPage,
  type Inspection,
  inspect,
  type Model,
  type Row,
  session,
  Transport,
  type TransportApi,
} from "../core/index.ts";
import * as s from "./styles.ts";

// The sheet of the overlay, put in by the build (vite.config.ts) in place of this string.
const SHEET = "__CSSINTS_DEVTOOLS_SHEET__";
const HOST = "cssints-devtools";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const run = (model: Model, el: Element): Inspection | string => {
  // @effect-diagnostics-next-line strictEffectProvide:off -- the UI's edge: the one place the core meets the page
  const exit = Effect.runSyncExit(inspect(model, el).pipe(Effect.provide(domPage)));
  return Exit.isSuccess(exit) ? exit.value : String(exit.cause);
};

const openInEditor = (file: string, line: number, column: number) =>
  // @effect-diagnostics-next-line globalFetch:off -- plain UI code: a fire-and-forget request to Vite's middleware
  void fetch(`/__open-in-editor?file=${encodeURIComponent(`${file}:${line}:${column + 1}`)}`);

const relative = (root: string, file: string) =>
  file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;

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

function Panel(props: { inspection: Inspection }) {
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
                  <button
                    class={s.site}
                    data-site={`${relative(i().root, site().file)}:${site().line}`}
                    onClick={() => openInEditor(site().file, site().line, site().column)}
                  >
                    {relative(i().root, site().file)}:{site().line} ↗
                  </button>
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
}) {
  const [open, setOpen] = createSignal(false);
  const [picking, setPicking] = createSignal(false);
  const [hovered, setHovered] = createSignal<Element>();
  const [selected, setSelected] = createSignal<Element>();
  const [tick, setTick] = createSignal(0);
  const target = () => (picking() ? (hovered() ?? selected()) : selected());

  const toggle = (on = !open()) => {
    setOpen(on);
    setPicking(on && !selected());
    props.setActive(on);
  };
  const inspection = createMemo(() => {
    tick();
    const m = props.model();
    const el = target();
    return open() && m && el?.isConnected ? run(m, el) : undefined;
  });
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
        <aside class={s.panel} data-devtools="panel">
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
            fallback={<div class={s.hint}>waiting for the dev server…</div>}
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
              {(i) => <Panel inspection={i()} />}
            </Show>
          </Show>
        </aside>
      </Show>
    </>
  );
}

/**
 * Puts the overlay in the page, connected to the dev server (virtual:cssints/devtools calls it).
 * @param {TransportApi & { root: string }} transport the HMR channel, and the root of the app
 */
export function mount(transport: TransportApi & { root: string }): void {
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
  render(
    () => <App model={model} setActive={(on) => Effect.runSync(s.setActive(on))} host={host} />,
    root,
  );
}
